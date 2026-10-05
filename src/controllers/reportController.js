const { db } = require('../config/db');

/**
 * 30. Generate Team or Member Report
 */
function getReport(req, res, next) {
  try {
    const member = req.query.member || 'team';
    const projectId = req.query.projectId;

    if (!projectId || projectId === 'null') {
      return res.json({
        heading: member === 'team' ? 'Team execution checklist' : `${member} — member work report`,
        work: '0 / 0',
        checklist: '0 / 0',
        tasks: '0',
        risks: '0',
        eff: '0%',
        est: '0.0h',
        actual: '0.0h',
        items: [],
        memberRows: []
      });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);

    if (member === 'team') {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
      const onTimeTasks = tasks.filter(t => t.is_before_deadline === 1).length;
      const risks = tasks.filter(t => t.status === 'late' || (t.status === 'pending' && t.notes && t.notes.includes('RISK'))).length;

      const estSum = tasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
      const actSum = tasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
      const effPct = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;

      const checklistItems = tasks.slice(0, 10).map(t => [
        t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
        t.title,
        `${t.member_name} • ${t.status === 'done' ? 'completed ' + (t.completed_at || 'on time') : 'pending'} • deadline ${t.deadline_time || t.deadline_day || 'Sprint 01'}`,
        `EST ${t.est_hours || 0}H / ACT ${t.act_hours || 0}H`
      ]);

      const memberMap = {};
      tasks.forEach(t => {
        if (!memberMap[t.member_name]) {
          memberMap[t.member_name] = { tasks: [], done: 0, risks: 0, est: 0, act: 0 };
        }
        memberMap[t.member_name].tasks.push(t);
        if (t.status === 'done' || t.status === 'late') memberMap[t.member_name].done++;
        if (t.status === 'late' || (t.notes && t.notes.includes('RISK'))) memberMap[t.member_name].risks++;
        memberMap[t.member_name].est += (t.est_hours || 0);
        memberMap[t.member_name].act += (t.act_hours || 0);
      });

      const memberRows = Object.entries(memberMap).map(([m, data]) => {
        const count = data.tasks.length;
        const eff = count > 0 ? Math.round((data.done / count) * 100) : 0;
        return {
          member: m,
          work: `${data.done} / ${count}`,
          tasks: count,
          risks: data.risks,
          eff: `${eff}%`,
          est: `${data.est.toFixed(1)}h`,
          actual: `${data.act.toFixed(1)}h`
        };
      });

      res.json({
        heading: 'Team execution checklist',
        work: `${completedTasks} / ${totalTasks}`,
        checklist: `${completedTasks} / ${totalTasks}`,
        tasks: String(totalTasks),
        risks: String(risks),
        eff: `${effPct}%`,
        est: `${estSum.toFixed(1)}h`,
        actual: `${actSum.toFixed(1)}h`,
        items: checklistItems,
        memberRows
      });
    } else {
      // Individual member report
      const mTasks = tasks.filter(t => (t.member_name || '').toLowerCase() === member.toLowerCase());
      const total = mTasks.length;
      const completed = mTasks.filter(t => t.status === 'done' || t.status === 'late').length;
      const risks = mTasks.filter(t => t.status === 'late' || (t.notes && t.notes.includes('RISK'))).length;
      const estSum = mTasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
      const actSum = mTasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
      const effPct = total > 0 ? Math.round((completed / total) * 100) : 0;

      const checklistItems = mTasks.map(t => [
        t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
        t.title,
        `${t.status === 'done' ? 'Completed ' + (t.completed_at || 'on time') : 'Pending'} • deadline ${t.deadline_time || t.deadline_day || 'Sprint 01'}`,
        `EST ${t.est_hours || 0}H / ACT ${t.act_hours || 0}H`
      ]);

      res.json({
        heading: `${member} — member work report`,
        work: `${completed} / ${total}`,
        checklist: `${completed} / ${total}`,
        tasks: String(total),
        risks: String(risks),
        eff: `${effPct}%`,
        est: `${estSum.toFixed(1)}h`,
        actual: `${actSum.toFixed(1)}h`,
        items: checklistItems,
        memberRows: total > 0 ? [{
          member,
          work: `${completed} / ${total}`,
          tasks: total,
          risks,
          eff: `${effPct}%`,
          est: `${estSum.toFixed(1)}h`,
          actual: `${actSum.toFixed(1)}h`
        }] : []
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReport
};
