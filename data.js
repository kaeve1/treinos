const DEFAULT_PLAN = {
  id: 'kevin-upper-lower-v1',
  name: 'Kevin Protocol',
  athleteName: 'Kevin',
  weeklyGoal: 4,
  restDays: [0, 3, 6],
  schedule: {
    1: 'A',
    2: 'B',
    4: 'C',
    5: 'D'
  },
  days: [
    {
      id: 'A',
      weekday: 1,
      day: 'Segunda',
      label: 'Upper A',
      focus: 'Peito · Costas · Ombro',
      color: '#7C8CFF',
      warmup: '5 min de mobilidade + 2 séries leves do primeiro exercício.',
      exercises: [
        { id: 'supino-reto', name: 'Supino reto', sets: 4, reps: '8–10', rest: 120, muscles: ['Peito'], secondary: ['Tríceps', 'Ombros'], equipment: 'Barra', tempo: '2-0-1', cues: ['Escápulas encaixadas', 'Pés firmes no chão', 'Desça controlando a barra'] },
        { id: 'remada-curvada', name: 'Remada curvada', sets: 4, reps: '8–10', rest: 120, muscles: ['Costas'], secondary: ['Bíceps', 'Lombar'], equipment: 'Barra', tempo: '2-1-1', cues: ['Coluna neutra', 'Cotovelos puxam para trás', 'Não roube com o tronco'] },
        { id: 'desenvolvimento-halteres', name: 'Desenvolvimento com halteres', sets: 3, reps: '10–12', rest: 90, muscles: ['Ombros'], secondary: ['Tríceps'], equipment: 'Halteres', tempo: '2-0-1', cues: ['Punhos alinhados', 'Não hiperestenda a lombar', 'Suba até quase travar'] },
        { id: 'crucifixo-inclinado', name: 'Crucifixo inclinado', sets: 3, reps: '12', rest: 75, muscles: ['Peito superior'], secondary: ['Ombros'], equipment: 'Halteres', tempo: '3-1-1', cues: ['Cotovelos semi-flexionados', 'Amplitude confortável', 'Contraia no topo'] },
        { id: 'puxada-frontal', name: 'Puxada frontal', sets: 3, reps: '12', rest: 90, muscles: ['Dorsais'], secondary: ['Bíceps'], equipment: 'Polia', tempo: '2-1-1', cues: ['Peito aberto', 'Puxe com as costas', 'Evite balançar'] },
        { id: 'elevacao-lateral', name: 'Elevação lateral', sets: 3, reps: '15', rest: 60, muscles: ['Ombros'], secondary: [], equipment: 'Halteres', tempo: '2-1-2', cues: ['Suba até a linha dos ombros', 'Controle a descida', 'Pouco impulso'] }
      ]
    },
    {
      id: 'B',
      weekday: 2,
      day: 'Terça',
      label: 'Lower A',
      focus: 'Quadríceps · Posterior · Glúteo',
      color: '#33D69F',
      warmup: 'Mobilidade de quadril/tornozelo + séries progressivas no agachamento.',
      exercises: [
        { id: 'agachamento-livre', name: 'Agachamento livre', sets: 4, reps: '8–10', rest: 150, muscles: ['Quadríceps', 'Glúteo'], secondary: ['Posterior', 'Core'], equipment: 'Barra', tempo: '3-0-1', cues: ['Joelhos acompanham os pés', 'Tronco firme', 'Profundidade segura'] },
        { id: 'leg-press-45', name: 'Leg press 45°', sets: 4, reps: '10–12', rest: 120, muscles: ['Quadríceps', 'Glúteo'], secondary: ['Posterior'], equipment: 'Máquina', tempo: '2-0-1', cues: ['Não trave os joelhos', 'Controle a descida', 'Pés estáveis'] },
        { id: 'cadeira-extensora', name: 'Cadeira extensora', sets: 3, reps: '12–15', rest: 75, muscles: ['Quadríceps'], secondary: [], equipment: 'Máquina', tempo: '2-1-2', cues: ['Segure no topo', 'Não bata a pilha', 'Amplitude completa'] },
        { id: 'mesa-flexora', name: 'Mesa flexora', sets: 3, reps: '12', rest: 75, muscles: ['Posterior'], secondary: ['Glúteo'], equipment: 'Máquina', tempo: '2-1-2', cues: ['Quadril encaixado', 'Controle o retorno', 'Sinta posterior'] },
        { id: 'panturrilha-em-pe', name: 'Panturrilha em pé', sets: 4, reps: '15–20', rest: 60, muscles: ['Panturrilha'], secondary: [], equipment: 'Máquina', tempo: '2-1-2', cues: ['Pausa em cima', 'Alongue embaixo', 'Sem pressa'] }
      ]
    },
    {
      id: 'C',
      weekday: 4,
      day: 'Quinta',
      label: 'Upper B',
      focus: 'Peito · Costas · Braços',
      color: '#FFB020',
      warmup: 'Mobilidade escapular + aquecimento leve para ombros e cotovelos.',
      exercises: [
        { id: 'supino-inclinado', name: 'Supino inclinado', sets: 4, reps: '8–10', rest: 120, muscles: ['Peito superior'], secondary: ['Tríceps', 'Ombros'], equipment: 'Barra/Halteres', tempo: '2-0-1', cues: ['Banco estável', 'Barra desce no alto do peito', 'Não perca a escápula'] },
        { id: 'remada-serrote', name: 'Remada serrote', sets: 4, reps: '10', rest: 90, muscles: ['Costas', 'Dorsais'], secondary: ['Bíceps'], equipment: 'Halter', tempo: '2-1-1', cues: ['Cotovelos para o quadril', 'Evite girar o tronco', 'Controle a descida'] },
        { id: 'rosca-direta', name: 'Rosca direta', sets: 3, reps: '10–12', rest: 75, muscles: ['Bíceps'], secondary: ['Antebraço'], equipment: 'Barra', tempo: '2-1-2', cues: ['Cotovelos fixos', 'Sem balanço', 'Desça completo'] },
        { id: 'triceps-testa', name: 'Tríceps testa', sets: 3, reps: '10–12', rest: 75, muscles: ['Tríceps'], secondary: [], equipment: 'Barra/Halteres', tempo: '2-0-2', cues: ['Cotovelos fechados', 'Controle a fase excêntrica', 'Amplitude confortável'] },
        { id: 'rosca-martelo', name: 'Rosca martelo', sets: 3, reps: '12', rest: 60, muscles: ['Bíceps', 'Antebraço'], secondary: [], equipment: 'Halteres', tempo: '2-1-2', cues: ['Punho neutro', 'Suba sem girar', 'Controle total'] },
        { id: 'triceps-corda', name: 'Tríceps polia corda', sets: 3, reps: '12–15', rest: 60, muscles: ['Tríceps'], secondary: [], equipment: 'Polia', tempo: '2-1-2', cues: ['Abra a corda no fim', 'Ombros baixos', 'Cotovelos fixos'] }
      ]
    },
    {
      id: 'D',
      weekday: 5,
      day: 'Sexta',
      label: 'Lower B',
      focus: 'Posterior · Glúteo · Core',
      color: '#FF5C8A',
      warmup: 'Ativação de glúteo + mobilidade de posterior antes do terra romeno.',
      exercises: [
        { id: 'terra-romeno', name: 'Terra romeno', sets: 4, reps: '8–10', rest: 150, muscles: ['Posterior', 'Glúteo'], secondary: ['Lombar'], equipment: 'Barra/Halteres', tempo: '3-1-1', cues: ['Quadril vai para trás', 'Barra próxima da perna', 'Coluna neutra'] },
        { id: 'avanco-halteres', name: 'Avanço com halteres', sets: 3, reps: '12 cada', rest: 90, muscles: ['Quadríceps', 'Glúteo'], secondary: ['Posterior'], equipment: 'Halteres', tempo: '2-0-1', cues: ['Passo estável', 'Joelho acompanha o pé', 'Suba empurrando o chão'] },
        { id: 'cadeira-flexora', name: 'Cadeira flexora', sets: 3, reps: '12–15', rest: 75, muscles: ['Posterior'], secondary: [], equipment: 'Máquina', tempo: '2-1-2', cues: ['Pausa contraindo', 'Sem impulso', 'Amplitude completa'] },
        { id: 'abducao-quadril', name: 'Abdução de quadril', sets: 3, reps: '15', rest: 60, muscles: ['Glúteo médio'], secondary: ['Abdutores'], equipment: 'Máquina/Elástico', tempo: '2-1-2', cues: ['Tronco firme', 'Pausa aberto', 'Não roube com lombar'] },
        { id: 'prancha', name: 'Prancha', sets: 3, reps: '30–45s', rest: 60, muscles: ['Core'], secondary: ['Ombros'], equipment: 'Peso corporal', tempo: 'Isometria', cues: ['Glúteo contraído', 'Costelas fechadas', 'Respire controlado'] },
        { id: 'elevacao-pernas', name: 'Elevação de pernas', sets: 3, reps: '15', rest: 60, muscles: ['Abdômen'], secondary: ['Core'], equipment: 'Peso corporal', tempo: '2-1-2', cues: ['Controle a descida', 'Não force a lombar', 'Suba com abdômen'] }
      ]
    }
  ]
};

const KNOWLEDGE_CARDS = [
  {
    title: 'Regra de progressão',
    text: 'Quando bater o topo da faixa de repetições em todas as séries com boa forma, aumente a carga no próximo treino.',
    tag: 'Força'
  },
  {
    title: 'Descanso também é treino',
    text: 'Sono, comida e consistência sustentam evolução. O app registra execução; seu corpo responde na recuperação.',
    tag: 'Recuperação'
  },
  {
    title: 'Carga sem técnica não conta',
    text: 'Priorize amplitude, controle e segurança. Dor articular persistente é sinal para reduzir carga e buscar orientação.',
    tag: 'Técnica'
  }
];
