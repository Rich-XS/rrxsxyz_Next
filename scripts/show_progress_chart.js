#!/usr/bin/env node
/**
 * T-310 任务进程示意图生成器（正确格式版本）
 * 功能：生成阶段化任务进度可视化图表（使用任务块格式）
 * 使用：node scripts/show_progress_chart.js
 * 格式：|xxx| = 已完成, |===| = Sonnet-ONLY, |...| = 均可, |---| = Haiku优先
 */

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

// 计算任务宽度（基于工作量和模型效率）
function getTaskWidth(hours, model) {
  const baseWidth = Math.ceil(hours);

  let width;
  switch (model) {
    case 'Haiku':
      // Haiku 效率高，宽度缩短
      width = Math.max(2, Math.ceil(baseWidth / 1.5));
      break;
    case 'Sonnet':
      width = baseWidth;
      break;
    case 'Both':
      // 均可，取中间值
      width = Math.ceil(baseWidth * 0.8);
      break;
    default:
      width = baseWidth;
  }

  return Math.max(2, width);
}

// 生成单个任务块
function getTaskBlock(task) {
  const width = getTaskWidth(task.hours, task.model);

  let char;
  if (task.status === 'Done') {
    char = 'x';
  } else {
    switch (task.model) {
      case 'Sonnet': char = '='; break;
      case 'Haiku': char = '-'; break;
      case 'Both': char = '.'; break;
      default: char = '.';
    }
  }

  return '|' + char.repeat(width);
}

// 定义各阶段任务数据（硬编码，基于当前项目状态）
const stage1Tasks = [
  { name: '#018', hours: 0.5, model: 'Both', status: 'Done' },
  { name: '#008', hours: 2, model: 'Sonnet', status: 'Done' },
  { name: '#059', hours: 1, model: 'Both', status: 'Done' },
  { name: '#014', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#083-S1', hours: 8, model: 'Sonnet', status: 'Done' },
  { name: '#035', hours: 2, model: 'Haiku', status: 'Done' },
  { name: '#084', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#057', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#111', hours: 0.5, model: 'Haiku', status: 'Done' },
  { name: '#064', hours: 2, model: 'Both', status: 'Done' },
  { name: '#066', hours: 0.5, model: 'Haiku', status: 'Done' },
  { name: '#067', hours: 1, model: 'Both', status: 'Done' },
  { name: '#112', hours: 2, model: 'Sonnet', status: 'Done' },
  { name: '#083', hours: 3, model: 'Sonnet', status: 'Done' },
  { name: '#104', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#065', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#109', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#110', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#114', hours: 2, model: 'Both', status: 'Done' },
  { name: '#115-124', hours: 4, model: 'Both', status: 'Done' },
  { name: '#116-122', hours: 3, model: 'Haiku', status: 'Done' },
  { name: '#002', hours: 2, model: 'Both', status: 'Done' }
];

const stage2Tasks = [
  { name: '#013', hours: 6, model: 'Sonnet', status: 'Done' },
  { name: '#042-045', hours: 4, model: 'Sonnet', status: 'Done' },
  { name: '#128', hours: 2, model: 'Both', status: 'Done' },
  { name: '#127', hours: 1, model: 'Haiku', status: 'Done' },
  { name: '#126', hours: 2, model: 'Both', status: 'Pending' },
  { name: '#125', hours: 8, model: 'Sonnet', status: 'Pending' },
  { name: '#130', hours: 2, model: 'Haiku', status: 'Pending' },
  { name: 'T-305', hours: 8, model: 'Both', status: 'Pending' },
  { name: 'T-308', hours: 4, model: 'Both', status: 'Pending' },
  { name: 'T-309', hours: 6, model: 'Sonnet', status: 'Pending' },
  { name: 'T-312', hours: 3, model: 'Haiku', status: 'Pending' },
  { name: 'T-314', hours: 10, model: 'Sonnet', status: 'Pending' }
];

const stage3Tasks = [
  { name: 'T-302', hours: 5, model: 'Sonnet', status: 'Done' },
  { name: 'T-304', hours: 4, model: 'Sonnet', status: 'Done' },
  { name: 'T-303', hours: 6, model: 'Sonnet', status: 'Done' },
  { name: 'T-311', hours: 2, model: 'Haiku', status: 'Pending' },
  { name: 'T-313', hours: 2, model: 'Haiku', status: 'Pending' },
  { name: 'T-306', hours: 8, model: 'Sonnet', status: 'Pending' },
  { name: 'T-307', hours: 4, model: 'Both', status: 'Pending' },
  { name: 'T-310', hours: 3, model: 'Both', status: 'Pending' },
  { name: '#087', hours: 12, model: 'Sonnet', status: 'Pending' },
  { name: '#137', hours: 10, model: 'Sonnet', status: 'Pending' }
];

const stage4Tasks = [
  { name: '#007', hours: 8, model: 'Both', status: 'Pending' },
  { name: '#009', hours: 6, model: 'Sonnet', status: 'Pending' },
  { name: '#010', hours: 8, model: 'Sonnet', status: 'Pending' },
  { name: '#076', hours: 12, model: 'Sonnet', status: 'Pending' },
  { name: '#086', hours: 15, model: 'Sonnet', status: 'Pending' },
  { name: '#095', hours: 10, model: 'Sonnet', status: 'Pending' },
  { name: '#024', hours: 20, model: 'Both', status: 'Pending' },
  { name: '#025-026', hours: 30, model: 'Both', status: 'Pending' }
];

// 生成阶段进度行
function getStageProgress(stageName, tasks) {
  // 生成任务块
  const taskBlocks = tasks.map(task => getTaskBlock(task)).join('') + '|';

  // 计算统计
  const completed = tasks.filter(t => t.status === 'Done').length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedHours = tasks.filter(t => t.status === 'Done').reduce((sum, t) => sum + t.hours, 0);
  const totalHours = tasks.reduce((sum, t) => sum + t.hours, 0);
  const hoursRate = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  // 对齐填充（确保任务块部分固定宽度）
  const maxBlockLength = 50;
  const padding = ' '.repeat(Math.max(0, maxBlockLength - taskBlocks.length));

  // 构建输出行
  const stats = `(任务#: ${completed}/${total} ${completionRate}%; 工作量H: ${completedHours}/${totalHours} ${hoursRate}%)`;

  return {
    stageName,
    taskBlocks,
    padding,
    stats,
    completed,
    total,
    completedHours,
    totalHours
  };
}

// 主函数
function main() {
  console.log('');
  console.log(colors.cyan + '╔═══════════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.cyan + '║            📊 多魔汰项目任务进程示意图 (T-310)                      ║' + colors.reset);
  console.log(colors.cyan + '╚═══════════════════════════════════════════════════════════════════╝' + colors.reset);
  console.log('');

  // 生成各阶段进度
  const stage1 = getStageProgress('阶段一', stage1Tasks);
  const stage2 = getStageProgress('阶段二', stage2Tasks);
  const stage3 = getStageProgress('阶段三', stage3Tasks);
  const stage4 = getStageProgress('阶段四', stage4Tasks);

  const stages = [stage1, stage2, stage3, stage4];

  // 输出各阶段（带颜色）
  stages.forEach(stage => {
    let color;
    if (stage.completed === stage.total) {
      color = colors.green;
    } else if (stage.completed > 0) {
      color = colors.yellow;
    } else {
      color = colors.white;
    }

    process.stdout.write(stage.stageName + ': ');
    process.stdout.write(color + stage.taskBlocks + stage.padding + colors.reset);
    console.log(' ' + colors.gray + stage.stats + colors.reset);
  });

  console.log('');
  console.log(colors.gray + '─────────────────────────────────────────────────────────────────────────' + colors.reset);

  // 总体统计
  const totalCompleted = stages.reduce((sum, s) => sum + s.completed, 0);
  const totalTasks = stages.reduce((sum, s) => sum + s.total, 0);
  const totalCompletedHours = stages.reduce((sum, s) => sum + s.completedHours, 0);
  const totalHours = stages.reduce((sum, s) => sum + s.totalHours, 0);

  const overallRate = Math.round((totalCompleted / totalTasks) * 100 * 10) / 10;
  const overallHoursRate = Math.round((totalCompletedHours / totalHours) * 100 * 10) / 10;

  console.log('');
  console.log(colors.cyan + `📈 总体进度: 任务 ${totalCompleted}/${totalTasks} (${overallRate}%) | 工作量 ${totalCompletedHours}/${totalHours} 小时 (${overallHoursRate}%)` + colors.reset);
  console.log(colors.cyan + `⏱️  预估剩余工作量: ${totalHours - totalCompletedHours} 小时` + colors.reset);
  console.log('');

  // 符号说明
  console.log(colors.yellow + '符号说明:' + colors.reset);
  console.log(colors.gray + '  x = 已完成任务' + colors.reset);
  console.log(colors.gray + '  = = Sonnet-ONLY 任务 (复杂架构/核心算法)' + colors.reset);
  console.log(colors.gray + '  . = Sonnet/Haiku 均可任务 (常规开发)' + colors.reset);
  console.log(colors.gray + '  - = Haiku 优先任务 (简单修复/UI调整)' + colors.reset);
  console.log('');
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { main, getTaskBlock, getTaskWidth };
