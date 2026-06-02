const WORKOUT_DATA = [
  {
    id: 'A',
    day: 'Segunda',
    label: 'Upper A',
    focus: 'Peito · Costas · Ombro',
    color: '#4A7CF7',
    colorBg: '#0f1a35',
    exercises: [
      { name: 'Supino reto', sets: 4, reps: '8–10', muscles: ['pectorais'], secondary: ['tríceps', 'ombros'], search: 'barbell bench press', gifId: 'EIeI8Vf', yt: 'supino+reto+técnica+academia' },
      { name: 'Remada curvada', sets: 4, reps: '8–10', muscles: ['costas sup.'], secondary: ['bíceps', 'lombar'], search: 'barbell bent over row', gifId: 'OBvQGz', yt: 'remada+curvada+técnica+academia' },
      { name: 'Desenvolvimento halteres', sets: 3, reps: '10–12', muscles: ['ombros'], secondary: ['tríceps'], search: 'dumbbell shoulder press', gifId: 'LBsvBi', yt: 'desenvolvimento+halteres+ombro+técnica' },
      { name: 'Crucifixo inclinado', sets: 3, reps: '12', muscles: ['pectorais'], secondary: ['ombros'], search: 'incline dumbbell fly', gifId: '0I8Kvq', yt: 'crucifixo+inclinado+técnica' },
      { name: 'Puxada frontal', sets: 3, reps: '12', muscles: ['dorsais'], secondary: ['bíceps'], search: 'cable lat pulldown', gifId: '3_bOT4', yt: 'puxada+frontal+técnica+academia' },
      { name: 'Elevação lateral', sets: 3, reps: '15', muscles: ['ombros'], secondary: [], search: 'dumbbell lateral raise', gifId: '0IkSMR', yt: 'elevação+lateral+ombro+técnica' },
    ]
  },
  {
    id: 'B',
    day: 'Terça',
    label: 'Lower A',
    focus: 'Quadríceps · Posterior · Glúteo',
    color: '#34C98A',
    colorBg: '#0a2318',
    exercises: [
      { name: 'Agachamento livre', sets: 4, reps: '8–10', muscles: ['quadríceps', 'glúteo'], secondary: ['posteriores', 'panturrilha'], search: 'barbell squat', gifId: '0XUjwV', yt: 'agachamento+livre+técnica+academia' },
      { name: 'Leg press 45°', sets: 4, reps: '10–12', muscles: ['quadríceps', 'glúteo'], secondary: ['posteriores'], search: 'leg press', gifId: '0XUg3N', yt: 'leg+press+45+técnica' },
      { name: 'Cadeira extensora', sets: 3, reps: '12–15', muscles: ['quadríceps'], secondary: [], search: 'leg extension', gifId: '0XUg2h', yt: 'cadeira+extensora+técnica' },
      { name: 'Mesa flexora', sets: 3, reps: '12', muscles: ['posteriores'], secondary: ['glúteo'], search: 'lying leg curl', gifId: '0XUg19', yt: 'mesa+flexora+técnica+academia' },
      { name: 'Panturrilha em pé', sets: 4, reps: '15–20', muscles: ['panturrilha'], secondary: [], search: 'standing calf raise', gifId: '0TUB8q', yt: 'panturrilha+em+pé+técnica' },
    ]
  },
  {
    id: 'C',
    day: 'Quinta',
    label: 'Upper B',
    focus: 'Bíceps · Tríceps · Ombro',
    color: '#F5A623',
    colorBg: '#2a1a00',
    exercises: [
      { name: 'Supino inclinado', sets: 4, reps: '8–10', muscles: ['pectorais sup.'], secondary: ['tríceps', 'ombros'], search: 'incline barbell bench press', gifId: '0I8Ktr', yt: 'supino+inclinado+técnica' },
      { name: 'Remada serrote', sets: 4, reps: '10', muscles: ['costas', 'dorsais'], secondary: ['bíceps'], search: 'dumbbell one arm row', gifId: '0I8Ktq', yt: 'remada+serrote+haltere+técnica' },
      { name: 'Rosca direta', sets: 3, reps: '10–12', muscles: ['bíceps'], secondary: ['antebraço'], search: 'barbell curl', gifId: '0BXM4m', yt: 'rosca+direta+barra+técnica' },
      { name: 'Tríceps testa', sets: 3, reps: '10–12', muscles: ['tríceps'], secondary: [], search: 'ez bar skull crusher', gifId: '0BXM4l', yt: 'tríceps+testa+barra+técnica' },
      { name: 'Rosca martelo', sets: 3, reps: '12', muscles: ['bíceps', 'antebraço'], secondary: [], search: 'dumbbell hammer curl', gifId: '0BXM4k', yt: 'rosca+martelo+haltere+técnica' },
      { name: 'Tríceps polia corda', sets: 3, reps: '12–15', muscles: ['tríceps'], secondary: [], search: 'cable rope tricep pushdown', gifId: '0BXM4j', yt: 'tríceps+polia+corda+técnica' },
    ]
  },
  {
    id: 'D',
    day: 'Sexta',
    label: 'Lower B',
    focus: 'Posterior · Glúteo · Core',
    color: '#E8507A',
    colorBg: '#2a0a14',
    exercises: [
      { name: 'Terra romeno', sets: 4, reps: '8–10', muscles: ['posteriores', 'glúteo'], secondary: ['lombar'], search: 'romanian deadlift', gifId: '1UF5t3', yt: 'terra+romeno+técnica+academia' },
      { name: 'Avanço com halteres', sets: 3, reps: '12 cada', muscles: ['quadríceps', 'glúteo'], secondary: ['posteriores'], search: 'dumbbell lunge', gifId: '0XUg1X', yt: 'avanço+passada+haltere+técnica' },
      { name: 'Cadeira flexora', sets: 3, reps: '12–15', muscles: ['posteriores'], secondary: [], search: 'seated leg curl', gifId: '0XUg18', yt: 'cadeira+flexora+técnica+academia' },
      { name: 'Abdução de quadril', sets: 3, reps: '15', muscles: ['glúteo'], secondary: ['abdutores'], search: 'cable hip abduction', gifId: '1UF5t4', yt: 'abdução+quadril+glúteo+técnica' },
      { name: 'Prancha', sets: 3, reps: '30–45s', muscles: ['core'], secondary: ['ombros'], search: 'plank', gifId: '0IkSN0', yt: 'prancha+abdominal+técnica' },
      { name: 'Elevação de pernas', sets: 3, reps: '15', muscles: ['abdômen'], secondary: ['core'], search: 'hanging leg raise', gifId: '0IkSMZ', yt: 'elevação+pernas+abdomen+técnica' },
    ]
  }
];

const INFO_DATA = {
  nutrition: {
    title: 'Nutrição',
    icon: 'ti-apple',
    sections: [
      { label: 'Meta calórica diária', value: '~2.550 kcal', note: 'Déficit leve de ~200 kcal do seu gasto estimado' },
      { label: 'Proteína', value: '160–180g/dia', note: '~2g por kg de peso. O material de construção do músculo.' },
      { label: 'Carboidrato', value: '~280g/dia', note: 'Energia para os treinos. Prefira arroz, batata, aveia.' },
      { label: 'Gordura', value: '~83g/dia', note: 'Essencial para hormônios. Azeite, ovos, castanhas.' },
    ],
    tip: 'Dica: distribua a proteína em 4–5 refeições ao dia, a cada 3–4 horas. Isso maximiza a síntese muscular.'
  },
  supplements: {
    title: 'Suplementos',
    icon: 'ti-pill',
    items: [
      { name: 'Creatina', priority: '1ª prioridade', dose: '3–5g por dia', when: 'Qualquer horário, todo dia', color: '#34C98A', why: 'Reabastece ATP mais rápido → mais força → mais músculo. O suplemento com mais evidência científica que existe.' },
      { name: 'Whey Protein', priority: '2ª prioridade', dose: '1 dose (25–30g proteína)', when: 'Pós-treino ou quando difícil bater a meta', color: '#4A7CF7', why: 'É só proteína em pó, prática e rápida. Não é mágica — substitui uma refeição proteica.' },
    ]
  },
  discipline: {
    title: 'Disciplina',
    icon: 'ti-brain',
    tips: [
      { icon: 'ti-moon', text: 'Prepare roupa e mochila na noite anterior. Elimine o atrito matinal.' },
      { icon: 'ti-writing', text: 'Anote o peso usado em cada série. Ver evolução é o maior motivador.' },
      { icon: 'ti-camera', text: 'Tire uma foto hoje. Em 3 meses você vai querer comparar.' },
      { icon: 'ti-clock', text: 'Trate o treino como reunião de trabalho. Não cancela.' },
      { icon: 'ti-trending-up', text: 'Tente aumentar o peso ou repetição a cada 1–2 semanas.' },
      { icon: 'ti-zzz', text: 'Durma 7–9h. O músculo cresce dormindo, não na academia.' },
    ]
  }
};
