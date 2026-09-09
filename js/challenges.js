/* Short, offline practice sequences. Completion means finishing this exercise,
   not a proficiency assessment. Phrase IDs stay stable across content edits. */
(function (root) {
  root.RussianChallenges = [
    {
      id: "introductions", icon: "👋", title: "Introduce yourself", description: "Say hello, give your name, and meet someone new.", outcome: "You practiced greeting someone and introducing yourself.",
      phrases: [
        { ru: "Здравствуйте!", en: "Hello! (polite)", hint: "Use this greeting with someone you don't know well." },
        { ru: "Меня зовут Анна.", en: "My name is Anna.", hint: "Replace Анна with your own name when you introduce yourself." },
        { ru: "Очень приятно.", en: "Nice to meet you.", hint: "A friendly response when you meet someone." }
      ],
      questions: [
        { prompt: "You meet your teacher for the first time. Choose a polite greeting.", choices: ["Здравствуйте!", "До свидания!", "Спасибо!"], answer: "Здравствуйте!", explanation: "Здравствуйте is a polite hello. До свидания means goodbye." },
        { prompt: "Someone says: «Меня зовут Анна». What are they telling you?", choices: ["Their name is Anna.", "They are looking for Anna.", "They are thanking Anna."], answer: "Their name is Anna.", explanation: "Меня зовут introduces your name." },
        { prompt: "Introduce yourself as Anna. Type: My name is Anna.", answer: "Меня зовут Анна.", hint: "Меня зовут …", explanation: "Меня зовут Анна. Now try saying the phrase aloud with your own name." }
      ]
    },
    {
      id: "cafe", icon: "☕", title: "Order at a café", description: "Ask for a coffee and finish your order politely.", outcome: "You practiced ordering coffee politely.",
      phrases: [
        { ru: "Можно кофе, пожалуйста?", en: "Could I have a coffee, please?", hint: "Можно …, пожалуйста? is a useful way to ask for something." },
        { ru: "С молоком.", en: "With milk.", hint: "Add this to say how you would like your coffee." },
        { ru: "Спасибо!", en: "Thank you!", hint: "A small word you'll use every day." }
      ],
      questions: [
        { prompt: "How do you politely ask for a coffee?", choices: ["Можно кофе, пожалуйста?", "Где вокзал?", "Меня зовут Анна."], answer: "Можно кофе, пожалуйста?", explanation: "Можно кофе, пожалуйста? asks for a coffee politely." },
        { prompt: "The barista asks: «С молоком?» What are they asking?", choices: ["With milk?", "To take away?", "With sugar?"], answer: "With milk?", explanation: "Молоко means milk; с молоком means with milk." },
        { prompt: "Type a polite request: Could I have a coffee, please?", answer: "Можно кофе, пожалуйста?", hint: "Можно …, пожалуйста?", explanation: "Можно кофе, пожалуйста? Try saying the whole order aloud." }
      ]
    },
    {
      id: "train", icon: "🚆", title: "Find your train", description: "Ask where the station is and read a departure time.", outcome: "You practiced asking for the station and understanding a departure time.",
      phrases: [
        { ru: "Где вокзал?", en: "Where is the train station?", hint: "Где means where. Вокзал is a railway station building." },
        { ru: "Когда отправляется поезд?", en: "When does the train depart?", hint: "Когда asks about time; поезд means train." },
        { ru: "В десять часов.", en: "At ten o'clock.", hint: "В introduces the time of the departure here." }
      ],
      questions: [
        { prompt: "You need directions to the railway station. What do you ask?", choices: ["Где вокзал?", "С молоком?", "Очень приятно."], answer: "Где вокзал?", explanation: "Где вокзал? means Where is the train station?" },
        { prompt: "You ask when your train leaves. The answer is «В десять часов». Choose the departure time.", choices: ["10:00", "02:00", "07:00"], answer: "10:00", explanation: "Десять is ten, so в десять часов means at ten o'clock." },
        { prompt: "Ask for directions. Type: Where is the train station?", answer: "Где вокзал?", hint: "Где …?", explanation: "Где вокзал? You can replace вокзал with another place you need." }
      ]
    }
  ];
})(typeof window !== "undefined" ? window : globalThis);
