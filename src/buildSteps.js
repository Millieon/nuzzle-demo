// Shared step generation from onboarding profile — used by CoachScreen and HomeScreen

function goalToStep(goal) {
  const g = goal.toLowerCase()
  if (g.includes('exercise') || g.includes('workout') || g.includes('gym') || g.includes('run'))
    return '15 min movement — whatever feels right today'
  if (g.includes('write') || g.includes('writing') || g.includes('journal'))
    return 'Write 200 words — just get something down'
  if (g.includes('meditat') || g.includes('mindful'))
    return '10 min meditation — guided or silent'
  if (g.includes('read'))
    return 'Read for 15 minutes — any book counts'
  if (g.includes('language') || g.includes('learn') || g.includes('study'))
    return '15 min study session — one topic, focused'
  if (g.includes('diet') || g.includes('eat') || g.includes('cook') || g.includes('health'))
    return 'Prepare one intentional meal today'
  if (g.includes('sleep') || g.includes('rest'))
    return 'Start winding down 30 min before bed'
  if (g.includes('code') || g.includes('program') || g.includes('build'))
    return '25 min focused coding — one feature or fix'
  if (g.includes('draw') || g.includes('paint') || g.includes('art') || g.includes('creative'))
    return '15 min creative practice — no pressure, just do'
  if (g.includes('music') || g.includes('instrument') || g.includes('practice'))
    return '20 min practice — scales or a piece you enjoy'
  return 'Spend 15 focused minutes on your goal'
}

export default function buildStepsFromProfile(profile) {
  const goal = profile?.goal || ''
  const energy = profile?.energy || 'Morning'
  const wake = profile?.wake || '7–8am'
  const free = profile?.free || ''
  const motivationStyle = profile?.motivationStyle || ''

  const morningLabel = {
    'Before 7am': '6:30 am',
    '7–8am': '7:30 am',
    '8–9am': '8:30 am',
    'After 9am': '9:30 am',
  }[wake] || '7:30 am'

  const anchor = {
    id: 1,
    text: '5 min breathing — before anything else',
    time: morningLabel,
    tag: 'now',
  }

  const goalStep = {
    id: 2,
    text: goalToStep(goal),
    time: energy,
    tag: 'later',
  }

  const moveTime = free.includes('Lunch break') ? 'Lunch' :
    free.includes('After work') ? '6 pm' :
    free.includes('Commute') ? 'Commute' : '6 pm'
  const move = {
    id: 3,
    text: 'Walk outside — any distance counts',
    time: moveTime,
    tag: 'later',
  }

  const reflectText = {
    intrinsic: 'Write one sentence about why today mattered',
    social: 'Share one thing you did today with someone',
    reward: 'Mark today\'s progress and check your streak',
    structure: 'Review tomorrow\'s plan before bed',
  }[motivationStyle] || 'Reflect on one small thing that went well'

  const reflect = {
    id: 4,
    text: reflectText,
    time: '9 pm',
    tag: 'later',
  }

  return [anchor, goalStep, move, reflect]
}
