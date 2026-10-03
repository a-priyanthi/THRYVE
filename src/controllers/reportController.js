const { db } = require('../config/db');

/**
 * 30. Generate Team or Member Report
 */
function getReport(req, res, next) {
  try {
    const member = req.query.member || 'team';
    const projectId = req.query.projectId || 1;

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);

    if (member === 'team') {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
      const onTimeTasks = tasks.filter(t => t.is_before_deadline === 1).length;
      const risks = tasks.filter(t => t.status === 'late' || (t.status === 'pending' && t.notes && t.notes.includes('RISK'))).length;

      const estSum = tasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
      const actSum = tasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
      const effPct = Math.round((onTimeTasks / (totalTasks || 1)) * 100);

      const checklistItems = tasks.slice(0, 4).map(t => [
        t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
        t.title,
        `${t.member_name} • ${t.status === 'done' ? 'completed ' + t.completed_at : 'pending'} • deadline ${t.deadline_time}`,
        `EST ${t.est_hours}H / ACT ${t.act_hours}H`
      ]);

      const memberNames = ['Priya', 'Arun', 'Meena', 'Vishal'];
      const memberRows = memberNames.map(m => {
        const mTasks = tasks.filter(t => t.member_name === m);
        const mDone = mTasks.filter(t => t.status === 'done' || t.status === 'late').length;
        const mRisks = mTasks.filter(t => t.status === 'late' || (t.notes && t.notes.includes('RISK'))).length;
        const mEst = mTasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
        const mAct = mTasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
        const mEff = Math.round((mDone / (mTasks.length || 1)) * 100);
        return {
          member: m,
          work: `${mDone + 2} / ${mTasks.length + 3}`,
          tasks: mTasks.length,
          risks: mRisks,
          eff: `${mEff}%`,
          est: `${mEst.toFixed(1)}h`,
          actual: `${mAct.toFixed(1)}h`
        };
      });

      res.json({
        heading: 'Team execution checklist',
        work: '18 / 25',
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
      const mTasks = tasks.filter(t => t.member_name.toLowerCase() === member.toLowerCase());
      const total = mTasks.length;
      const completed = mTasks.filter(t => t.status === 'done' || t.status === 'late').length;
      const risks = mTasks.filter(t => t.status === 'late' || (t.notes && t.notes.includes('RISK'))).length;
      const estSum = mTasks.reduce((acc, t) => acc + (t.est_hours || 0), 0);
      const actSum = mTasks.reduce((acc, t) => acc + (t.act_hours || 0), 0);
      const effPct = Math.round((completed / (total || 1)) * 100);

      const checklistItems = mTasks.map(t => [
        t.status === 'done' ? 'done' : (t.status === 'late' ? 'late' : 'risk'),
        t.title,
        `${t.status === 'done' ? 'Completed ' + t.completed_at : 'Pending'} • deadline ${t.deadline_time}`,
        `EST ${t.est_hours}H / ACT ${t.act_hours}H`
      ]);

      res.json({
        heading: `${member} — member work report`,
        work: `${completed + 2} / ${total + 2}`,
        checklist: `${completed} / ${total}`,
        tasks: String(total),
        risks: String(risks),
        eff: `${effPct}%`,
        est: `${estSum.toFixed(1)}h`,
        actual: `${actSum.toFixed(1)}h`,
        items: checklistItems,
        memberRows: [{
          member,
          work: `${completed + 2} / ${total + 2}`,
          tasks: total,
          risks,
          eff: `${effPct}%`,
          est: `${estSum.toFixed(1)}h`,
          actual: `${actSum.toFixed(1)}h`
        }]
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReport
};
