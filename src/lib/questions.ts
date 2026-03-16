export const QUESTIONS = [
  {
    id: 'q1',
    text: 'Hva er det første ordet du tenker på når du hører «utforskende»?',
    type: 'word_cloud' as const,
    options: null,
    is_active: false,
  },
  {
    id: 'q2',
    text: 'Hvor ofte tester du noe nytt i arbeidshverdagen?',
    type: 'multiple_choice' as const,
    options: ['Nesten aldri', 'Av og til', 'Jevnlig', 'Det er en del av jobben min'],
    is_active: false,
  },
  {
    id: 'q3',
    text: 'Hva er din største barriere for å bruke AI mer i jobben?',
    type: 'multiple_choice' as const,
    options: [
      'Vet ikke hvor jeg skal starte',
      'Mangler tid til å teste',
      'Usikker på hva som er lov',
      'Har ikke sett at det gir verdi ennå',
    ],
    is_active: false,
  },
  {
    id: 'q4',
    text: 'Hva er én ting du vil teste eller gjøre annerledes neste uke?',
    type: 'multiple_choice' as const,
    options: [
      'Prøve et AI-verktøy på en konkret arbeidsoppgave',
      'Dele noe jeg har lært med en kollega',
      'Stille et spørsmål jeg vanligvis ikke stiller',
      'Sette av tid til å utforske noe uten fasitsvar',
    ],
    is_active: false,
  },
];
