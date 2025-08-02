/* interface_langue enrichi avec intelligence conversationnelle */
const interface_langue = {
  fr: {
    precedent: "Précédent",
    suivant: "Suivant",
    ecouter: "Écouter",
    rejouer: "Réécouter",
    lectureAuto: "Lecture auto",
    chatTitre: "Discussion avec Hamadine",
    envoyer: "Envoyer",
    searchPlaceholder: "Rechercher un mot...",
    titrePrincipal: "Dictionnaire Tadaksahak Multilingue",
    presentation: "Très bientôt… une aventure dédiée à la langue Tadaksahak !",
    placeholderChat: "Écrivez un mot ici pour lancer une recherche",
    botIntro: "🤖 Salut, je suis Hamadine le bot Tadaksahak.<br>Demandez-moi un mot !",
    utilisateur: "Vous",
    incompréhension: "❓ Je ne comprends pas encore ce mot. Essaie autre chose !",

    botIntelligence: {
      salutations_triggers: ["salut", "bonjour", "hello", "hey", "yo", "salam", "azul"],
      salutations: ["Bonjour à toi !", "Bienvenue sur le dictionnaire Tadaksahak.", "Salam aleikoum !", "Azul fellak !", "Content de te revoir !"],
      remerciements: ["merci", "merci beaucoup", "trop cool", "je te remercie"],
      remerciements_reponses: ["Avec plaisir !", "Je suis là pour ça 😊", "N’hésite pas à explorer d’autres mots."],
      insultes: ["con", "idiot", "imbécile", "dégage", "va-t’en", "nul"],
      insulte: "🙏 Merci de rester respectueux. Je suis là pour t'aider.",
      émotions_triggers: ["je suis triste", "je suis content", "j’ai peur", "je suis en colère"],
      émotions_reponses: {
        "triste": "Tu veux que je te raconte une histoire joyeuse ?",
        "content": "C’est super 😊 ! Tu veux apprendre un mot nouveau pour fêter ça ?",
        "peur": "Je suis là avec toi. Connaître sa langue, c’est se renforcer.",
        "colère": "Souffler un peu, ça aide. Et si on partait dans le désert des mots ?"
      },
      météo_triggers: ["quel temps", "il fait chaud", "il fait froid"],
      météo_reponses: [
        "Je ne contrôle pas la météo 🌤️ mais j’ai des mots brûlants à te proposer.",
        "Ici c’est toujours le beau temps… linguistique !"
      ],
      proverbes_triggers: ["proverbe", "sagesse", "dicton"],
      proverbes: [
        "🌾 « Le vent ne casse pas l’arbre qui plie. »",
        "🐪 « Celui qui connaît le désert marche sans crainte. »",
        "🗣️ « Une langue oubliée est une mémoire éteinte. »"
      ],
      quiz_triggers: ["quiz", "jouer", "test"],
      quiz_reponse: "👉 Clique sur l’onglet « Quiz » pour tester tes connaissances !",
      aide_triggers: ["aide", "comment faire", "je ne comprends pas", "j’hésite"],
      aide_reponse: "Tu peux taper un mot, demander une anecdote, ou cliquer sur un onglet ci-dessus.",
      faq: {
        "qui es-tu": "Je suis Hamadine, le bot Tadaksahak.",
        "c’est quoi tadaksahak": "Le Tadaksahak est une langue parlée par les Idaksahak.",
        "qui a fait ce site": "Ce site a été conçu par Hamadine Ag Moctar.",
        "comment ça va": "Je vais très bien, merci ! Et toi ?",
        "quels mots je peux chercher": "Tu peux chercher n’importe quel mot connu dans le dictionnaire.",
        "comment t’utiliser": "Tape un mot, pose une question, explore le menu ou demande une histoire."
      }
    },

    chatTriggers: {
      origine: "originePhrase",
      langue: "languePhrase",
      ethnie: "ethniePhrase",
      identite: "identitePhrase",
      definition: "definitionPhrase"
    },

    chatPhrases: {
      originePhrase: "🔍 Voici quelques infos sur l’origine du peuple Idaksahak :",
      languePhrase: "🗣️ Parlons de la langue Tadaksahak :",
      ethniePhrase: "👥 À propos de l’ethnie Idaksahak :",
      identitePhrase: "ℹ️ Je suis Hamadine, ton assistant Tadaksahak.",
      definitionPhrase: "📖 Voici la définition que je peux trouver :"
    }
  }
};
