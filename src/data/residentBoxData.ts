import { Caregiver, ResidentMedicationBox } from '../types';

export const DEFAULT_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg-1',
    name: 'Marco Antônio',
    pinCode: '1234',
    role: 'CUIDADOR'
  },
  {
    id: 'cg-2',
    name: 'Juliana Costa',
    pinCode: '4321',
    role: 'CUIDADOR'
  },
  {
    id: 'cg-3',
    name: 'Carlos Eduardo',
    pinCode: '2026',
    role: 'CUIDADOR'
  },
  {
    id: 'cg-4',
    name: 'Renata Meirelles',
    pinCode: '0000',
    role: 'COORDENADOR'
  }
];

export const INITIAL_RESIDENT_BOXES: ResidentMedicationBox[] = [
  {
    id: 'res-box-1',
    residentName: 'Claudemir Fernandes',
    roomNumber: 'Quarto 07',
    startDate: '2026-10-02',
    endDate: '2026-10-06',
    periodDays: 5,
    lastRestockDate: '2026-10-02',
    notes: 'Atenção aos horários da noite. Verificar pressão arterial antes de administrar.',
    medications: [
      {
        id: 'med-item-1',
        name: 'Haldol (Haloperidol)',
        presentation: '5 mg',
        schedules: ['08:00', '20:00'],
        dailyUsage: 2,
        periodTotal: 10,
        currentStock: 9,
        specialInstructions: 'Administrar com água ou suco. Monitorar sonolência.'
      },
      {
        id: 'med-item-2',
        name: 'Biperideno',
        presentation: '2 mg',
        schedules: ['08:00', '20:00'],
        dailyUsage: 2,
        periodTotal: 10,
        currentStock: 8,
        specialInstructions: 'Para controle extrapiramidal. Não interromper sem ordem médica.'
      },
      {
        id: 'med-item-3',
        name: 'Haloperidol Decanoato',
        presentation: '50 mg/mL (Ampola)',
        schedules: ['14:00'],
        dailyUsage: 0,
        periodTotal: 2,
        currentStock: 2,
        specialInstructions: 'Aplicar 2 ampolas a cada 15 dias (Intramuscular profunda). Próxima dose em 05/10/2026.'
      },
      {
        id: 'med-item-4',
        name: 'Losartana Potássica',
        presentation: '50 mg',
        schedules: ['08:00'],
        dailyUsage: 1,
        periodTotal: 5,
        currentStock: 4,
        specialInstructions: 'Anti-hipertensivo. Aferir PA antes.'
      }
    ],
    history: [
      {
        id: 'log-1',
        timestamp: '2026-10-02T08:04:12.000Z',
        dateFormatted: '02/10/2026',
        timeFormatted: '08:04',
        medicationName: 'Haldol (Haloperidol) 5 mg',
        quantityAdministered: 1,
        remainingStock: 9,
        caregiverName: 'Marco Antônio',
        scheduleTime: '08:00',
        notes: 'Administrado sem queixas.'
      },
      {
        id: 'log-2',
        timestamp: '2026-10-02T08:05:00.000Z',
        dateFormatted: '02/10/2026',
        timeFormatted: '08:05',
        medicationName: 'Biperideno 2 mg',
        quantityAdministered: 1,
        remainingStock: 8,
        caregiverName: 'Marco Antônio',
        scheduleTime: '08:00',
        notes: 'Administrado no café da manhã.'
      },
      {
        id: 'log-3',
        timestamp: '2026-10-02T08:06:20.000Z',
        dateFormatted: '02/10/2026',
        timeFormatted: '08:06',
        medicationName: 'Losartana Potássica 50 mg',
        quantityAdministered: 1,
        remainingStock: 4,
        caregiverName: 'Marco Antônio',
        scheduleTime: '08:00',
        notes: 'PA aferida: 120x80 mmHg.'
      }
    ]
  },
  {
    id: 'res-box-2',
    residentName: 'Dona Nair de Souza',
    roomNumber: 'Quarto 03',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    periodDays: 15,
    lastRestockDate: '2026-10-01',
    notes: 'Dieta pastosa. Dificuldade de deglutição; macerar comprimidos se autorizado.',
    medications: [
      {
        id: 'med-item-201',
        name: 'Levotiroxina Sódica',
        presentation: '50 mcg',
        schedules: ['06:30'],
        dailyUsage: 1,
        periodTotal: 15,
        currentStock: 13,
        specialInstructions: 'Em jejum rigoroso, 30 minutos antes do café da manhã.'
      },
      {
        id: 'med-item-202',
        name: 'Omeprazol',
        presentation: '20 mg',
        schedules: ['07:00'],
        dailyUsage: 1,
        periodTotal: 15,
        currentStock: 13,
        specialInstructions: 'Protetor gástrico pela manhã.'
      },
      {
        id: 'med-item-203',
        name: 'Sertralina',
        presentation: '50 mg',
        schedules: ['08:00'],
        dailyUsage: 1,
        periodTotal: 15,
        currentStock: 2,
        specialInstructions: 'Atenção: Estoque crítico! Solicitar reabastecimento com familiares.'
      }
    ],
    history: [
      {
        id: 'log-201',
        timestamp: '2026-10-02T06:35:00.000Z',
        dateFormatted: '02/10/2026',
        timeFormatted: '06:35',
        medicationName: 'Levotiroxina Sódica 50 mcg',
        quantityAdministered: 1,
        remainingStock: 13,
        caregiverName: 'Juliana Costa',
        scheduleTime: '06:30',
        notes: 'Tomou em jejum com água.'
      }
    ]
  }
];
