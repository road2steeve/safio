// Fiches règles : un exemple de manche + les règles numérotées, pour chaque jeu.
// ex.rows = [qui, quoi, points]
const RULES_UI = {
  fr: { ex: "Exemple de manche", rules: "Les règles" },
  en: { ex: "Example round", rules: "The rules" },
  es: { ex: "Ejemplo de ronda", rules: "Las reglas" },
};

const RULES = {
  fr: {
    quiz: {
      ex: { top: "« Qui a peint La Joconde ? »", rows: [["Léa", "Léonard de Vinci", "+1"], ["Tom", "De Vinci", "+1"], ["Inès", "Picasso", ""]], note: "Chacun écrit sa réponse, le validateur dit qui a juste. « De Vinci » compte aussi." },
      steps: [
        "Choisis tous les thèmes ou seulement ceux que tu veux. Une question s'affiche avec un temps imparti, chacun écrit sa réponse sur son téléphone.",
        "Le validateur (l'hôte, aidé de co-validateurs s'il le veut) voit la réponse attendue et juge chaque réponse : 1 point si c'est juste, ½ point si c'est presque. Il peut laisser un commentaire.",
        "Celui qui a le plus de points gagne. Récapitulatif de toutes les questions et réponses à la fin.",
      ],
    },
    mytho: {
      ex: { top: "« Quelle est la capitale de l'Australie ? »", rows: [["Tom", "invente « Sydney »", "+1"], ["Léa", "choisit « Sydney »", ""], ["Inès", "choisit « Canberra »", "+2"]], note: "Tom a piégé Léa. Inès a trouvé la vraie réponse." },
      steps: [
        "Chacun invente une fausse réponse qui a l'air vraie.",
        "Toutes les réponses s'affichent, la vraie est cachée parmi elles : votez pour celle que vous croyez juste.",
        "2 points si vous trouvez la vraie réponse, 1 point par joueur qui vote pour votre fausse réponse.",
      ],
    },
    bac: {
      ex: { top: "Lettre B", rows: [["Pays", "Brésil", ""], ["Animal", "Baleine", ""], ["Métier", "Boulanger", ""]], note: "Le premier qui a tout rempli crie « Stop ! ». Une réponse que personne d'autre n'a trouvée vaut double." },
      steps: [
        "Une lettre est tirée, avec de nouvelles catégories à chaque manche. Trouvez un mot qui commence par cette lettre pour chaque catégorie.",
        "Le premier qui a tout rempli peut crier « Stop ! » : les autres ont encore 10 secondes, puis on passe à la lettre suivante.",
        "À la fin de toutes les manches, on revoit ensemble catégorie par catégorie ce que chacun a écrit. Le validateur juge : 2 points pour un mot que vous êtes seul à avoir trouvé, 1 point sinon (presque : la moitié).",
      ],
    },
    duel: {
      ex: { top: "« Combien de joueurs dans une équipe de foot ? »", rows: [["Tom", "11 · en 3 s", "+2"], ["Léa", "11 · en 5 s", "+1"]], note: "Corrigé tout seul. Bonne réponse : 1 point, et 1 de plus pour le plus rapide." },
      steps: [
        "Une question, peu de temps, une seule tentative : votre réponse est corrigée tout de suite.",
        "Les petites fautes de frappe sont acceptées.",
        "1 point par bonne réponse, et 1 point de plus pour le plus rapide.",
      ],
    },
    brain: {
      ex: { top: "« Un fruit rouge »", rows: [["Tom", "Fraise", "+2"], ["Léa", "Fraise", "+2"], ["Inès", "Fraise", "+2"], ["Max", "Cerise", ""]], note: "Trois joueurs ont pensé pareil : chacun marque 2 points." },
      steps: [
        "Un thème s'affiche. Chacun écrit la première chose qui lui vient… en essayant de penser comme les autres.",
        "Les réponses identiques sont regroupées. L'hôte peut fusionner deux réponses qui veulent dire la même chose.",
        "1 point par autre joueur qui a écrit la même chose que vous.",
      ],
    },
    youre: {
      ex: { top: "« Qui de nous arriverait en retard à son propre mariage ? »", rows: [["Tom", "vote Léa", "+1"], ["Inès", "vote Léa", "+1"], ["Léa", "vote Tom", ""]], note: "Léa est élue. Ceux qui ont voté pour elle marquent." },
      steps: [
        "Une question « Qui de nous… ? » s'affiche. Chacun vote pour un autre joueur, en secret.",
        "Le joueur qui reçoit le plus de voix est élu (il peut y avoir des ex æquo).",
        "1 point pour chaque joueur qui a voté pour l'élu. Il faut au moins 3 joueurs.",
      ],
    },
    closest: {
      ex: { top: "« Combien d'os dans le corps humain adulte ? » → 206", rows: [["Inès", "206 · pile juste", "+5"], ["Tom", "200 · à 6", "+2"], ["Léa", "300 · à 94", "+1"]], note: "Pas besoin de connaître la réponse, il faut juste être le plus proche." },
      steps: [
        "La réponse à chaque question est un nombre. Chacun donne son estimation.",
        "Les plus proches marquent 3, 2 et 1 points.",
        "Une réponse exacte rapporte 2 points de plus.",
      ],
    },
    torpille: {
      ex: { top: "Bonne réponse = 3 tirs", rows: [["Tom", "juste → 3 tirs", "💥 +1"], ["Léa", "faux → 1 tir", "• raté"]], note: "Chacun a une flotte cachée sur une grille de 6 × 6." },
      steps: [
        "Chaque manche commence par une question : bonne réponse = 3 tirs, mauvaise = 1 tir.",
        "Tirez sur la grille d'un adversaire (à 3 joueurs ou plus, choisissez votre cible).",
        "1 point par touche. La partie s'arrête quand une flotte est entièrement coulée.",
      ],
    },
  },
  en: {
    quiz: {
      ex: { top: "\"Who painted the Mona Lisa?\"", rows: [["Lea", "Leonardo da Vinci", "+1"], ["Tom", "Da Vinci", "+1"], ["Ines", "Picasso", ""]], note: "Everyone writes an answer, the judge says who's right. \"Da Vinci\" counts too." },
      steps: [
        "Play all themes or only the ones you pick. A question appears with a time limit; everyone types an answer on their phone.",
        "The judge (the host, helped by co-judges if they like) sees the expected answer and marks each one: 1 point if right, ½ point if almost. They can leave a comment.",
        "Most points wins. A recap of every question and answer is shown at the end.",
      ],
    },
    mytho: {
      ex: { top: "\"What is the capital of Australia?\"", rows: [["Tom", "makes up \"Sydney\"", "+1"], ["Lea", "picks \"Sydney\"", ""], ["Ines", "picks \"Canberra\"", "+2"]], note: "Tom fooled Lea. Ines found the real answer." },
      steps: [
        "Everyone invents a fake answer that sounds true.",
        "All answers are shown with the real one hidden among them: vote for the one you think is right.",
        "2 points for finding the real answer, 1 point per player who votes for your fake.",
      ],
    },
    bac: {
      ex: { top: "Letter B", rows: [["Country", "Brazil", ""], ["Animal", "Bear", ""], ["Job", "Baker", ""]], note: "The first to fill everything shouts \"Stop!\". An answer nobody else found is worth double." },
      steps: [
        "A letter is drawn, with new categories every round. Find a word starting with that letter for each category.",
        "The first to fill everything can shout \"Stop!\": the others get 10 more seconds, then on to the next letter.",
        "After all rounds, review everyone's answers together, category by category. The judge decides: 2 points for a word only you found, 1 point otherwise (almost: half).",
      ],
    },
    duel: {
      ex: { top: "\"How many players in a football team?\"", rows: [["Tom", "11 · in 3 s", "+2"], ["Lea", "11 · in 5 s", "+1"]], note: "Marked automatically. Right answer: 1 point, plus 1 for the fastest." },
      steps: [
        "One question, little time, one try: your answer is marked instantly.",
        "Small typos are accepted.",
        "1 point per right answer, plus 1 point for the fastest.",
      ],
    },
    brain: {
      ex: { top: "\"A red fruit\"", rows: [["Tom", "Strawberry", "+2"], ["Lea", "Strawberry", "+2"], ["Ines", "Strawberry", "+2"], ["Max", "Cherry", ""]], note: "Three players thought alike: each scores 2 points." },
      steps: [
        "A theme appears. Write the first thing that comes to mind… trying to think like the others.",
        "Identical answers are grouped. The host can merge two answers that mean the same thing.",
        "1 point per other player who wrote the same as you.",
      ],
    },
    youre: {
      ex: { top: "\"Who of us would be late to their own wedding?\"", rows: [["Tom", "votes Lea", "+1"], ["Ines", "votes Lea", "+1"], ["Lea", "votes Tom", ""]], note: "Lea is elected. Those who voted for her score." },
      steps: [
        "A \"Who of us…?\" question appears. Everyone secretly votes for another player.",
        "The player with the most votes is elected (ties are possible).",
        "1 point for each player who voted for the elected one. At least 3 players needed.",
      ],
    },
    closest: {
      ex: { top: "\"How many bones in the adult human body?\" → 206", rows: [["Ines", "206 · exact", "+5"], ["Tom", "200 · off by 6", "+2"], ["Lea", "300 · off by 94", "+1"]], note: "No need to know the answer, just be the closest." },
      steps: [
        "Every answer is a number. Everyone gives their best guess.",
        "The closest score 3, 2 and 1 points.",
        "An exact answer earns 2 extra points.",
      ],
    },
    torpille: {
      ex: { top: "Right answer = 3 shots", rows: [["Tom", "right → 3 shots", "💥 +1"], ["Lea", "wrong → 1 shot", "• miss"]], note: "Everyone has a hidden fleet on a 6 × 6 grid." },
      steps: [
        "Each round starts with a question: right answer = 3 shots, wrong = 1 shot.",
        "Fire at an opponent's grid (with 3+ players, choose your target).",
        "1 point per hit. The game ends when a whole fleet is sunk.",
      ],
    },
  },
  es: {
    quiz: {
      ex: { top: "«¿Quién pintó la Mona Lisa?»", rows: [["Lea", "Leonardo da Vinci", "+1"], ["Tom", "Da Vinci", "+1"], ["Inés", "Picasso", ""]], note: "Cada uno escribe su respuesta y el juez dice quién acierta. «Da Vinci» también vale." },
      steps: [
        "Juega con todos los temas o solo con los que elijas. Aparece una pregunta con tiempo límite y cada uno escribe su respuesta en el móvil.",
        "El juez (el anfitrión, con cojueces si quiere) ve la respuesta esperada y marca cada una: 1 punto si está bien, ½ punto si casi. Puede dejar un comentario.",
        "Gana quien tenga más puntos. Al final, resumen de todas las preguntas y respuestas.",
      ],
    },
    mytho: {
      ex: { top: "«¿Cuál es la capital de Australia?»", rows: [["Tom", "inventa «Sídney»", "+1"], ["Lea", "elige «Sídney»", ""], ["Inés", "elige «Canberra»", "+2"]], note: "Tom engañó a Lea. Inés encontró la respuesta real." },
      steps: [
        "Cada uno inventa una respuesta falsa que parezca verdadera.",
        "Se muestran todas las respuestas con la verdadera escondida entre ellas: vota la que creas correcta.",
        "2 puntos si encuentras la verdadera, 1 punto por cada jugador que vote tu respuesta falsa.",
      ],
    },
    bac: {
      ex: { top: "Letra B", rows: [["País", "Brasil", ""], ["Animal", "Ballena", ""], ["Profesión", "Bombero", ""]], note: "El primero que lo rellena todo grita «¡Stop!». Una respuesta que nadie más encontró vale el doble." },
      steps: [
        "Sale una letra, con categorías nuevas en cada ronda. Encuentra una palabra que empiece por esa letra para cada categoría.",
        "El primero que lo rellena todo puede gritar «¡Stop!»: los demás tienen 10 segundos más y se pasa a la letra siguiente.",
        "Al final de todas las rondas, se revisa todo juntos, categoría por categoría. El juez decide: 2 puntos por una palabra que solo tú encontraste, 1 si no (casi: la mitad).",
      ],
    },
    duel: {
      ex: { top: "«¿Cuántos jugadores tiene un equipo de fútbol?»", rows: [["Tom", "11 · en 3 s", "+2"], ["Lea", "11 · en 5 s", "+1"]], note: "Corrección automática. Respuesta correcta: 1 punto, y 1 más para el más rápido." },
      steps: [
        "Una pregunta, poco tiempo, un solo intento: tu respuesta se corrige al instante.",
        "Se aceptan pequeñas faltas de escritura.",
        "1 punto por respuesta correcta, y 1 más para el más rápido.",
      ],
    },
    brain: {
      ex: { top: "«Una fruta roja»", rows: [["Tom", "Fresa", "+2"], ["Lea", "Fresa", "+2"], ["Inés", "Fresa", "+2"], ["Max", "Cereza", ""]], note: "Tres jugadores pensaron igual: cada uno gana 2 puntos." },
      steps: [
        "Aparece un tema. Escribe lo primero que se te ocurra… intentando pensar como los demás.",
        "Las respuestas iguales se agrupan. El anfitrión puede unir dos respuestas que significan lo mismo.",
        "1 punto por cada otro jugador que escribió lo mismo que tú.",
      ],
    },
    youre: {
      ex: { top: "«¿Quién de nosotros llegaría tarde a su propia boda?»", rows: [["Tom", "vota a Lea", "+1"], ["Inés", "vota a Lea", "+1"], ["Lea", "vota a Tom", ""]], note: "Lea es elegida. Quienes la votaron puntúan." },
      steps: [
        "Aparece una pregunta «¿Quién de nosotros…?». Cada uno vota en secreto a otro jugador.",
        "El jugador con más votos es elegido (puede haber empates).",
        "1 punto por cada jugador que votó al elegido. Hacen falta al menos 3 jugadores.",
      ],
    },
    closest: {
      ex: { top: "«¿Cuántos huesos tiene el cuerpo humano adulto?» → 206", rows: [["Inés", "206 · exacto", "+5"], ["Tom", "200 · a 6", "+2"], ["Lea", "300 · a 94", "+1"]], note: "No hace falta saber la respuesta, solo acercarse más que nadie." },
      steps: [
        "La respuesta de cada pregunta es un número. Cada uno da su estimación.",
        "Los más cercanos ganan 3, 2 y 1 puntos.",
        "Una respuesta exacta da 2 puntos más.",
      ],
    },
    torpille: {
      ex: { top: "Respuesta correcta = 3 disparos", rows: [["Tom", "bien → 3 disparos", "💥 +1"], ["Lea", "mal → 1 disparo", "• agua"]], note: "Cada uno tiene una flota escondida en una cuadrícula de 6 × 6." },
      steps: [
        "Cada ronda empieza con una pregunta: respuesta correcta = 3 disparos, incorrecta = 1.",
        "Dispara a la cuadrícula de un rival (con 3 jugadores o más, elige tu objetivo).",
        "1 punto por impacto. La partida termina cuando una flota entera se hunde.",
      ],
    },
  },
};
