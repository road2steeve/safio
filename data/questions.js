// Banque de questions multilingue (fr, en, es).
// Format quiz : [thème, question FR, question EN, question ES, réponse, autres réponses acceptées]
//   réponse = texte identique dans toutes les langues, ou [FR, EN, ES]
//   Toutes les versions sont acceptées, quelle que soit la langue du joueur.

const more = require("./questions_more");
const THEMES_BASE = ["general", "geo", "hist", "sport", "cine", "music", "games", "sci", "nature", "food", "art", "myth", "tech", "manga"];
const THEMES = [...THEMES_BASE, ...more.NEW_THEMES];

const Q = [
  // ---------- Culture générale ----------
  ["general", "Combien de jours compte une année bissextile ?", "How many days are there in a leap year?", "¿Cuántos días tiene un año bisiesto?", "366"],
  ["general", "Combien de cartes compte un jeu classique, sans les jokers ?", "How many cards are in a standard deck, without jokers?", "¿Cuántas cartas tiene una baraja francesa estándar, sin comodines?", "52"],
  ["general", "Quelle est la monnaie du Japon ?", "What is the currency of Japan?", "¿Cuál es la moneda de Japón?", "Yen", ["Yen japonais", "Japanese yen"]],
  ["general", "Quelle langue parle-t-on officiellement au Brésil ?", "What is the official language of Brazil?", "¿Cuál es el idioma oficial de Brasil?", ["Portugais", "Portuguese", "Portugués"]],
  ["general", "Quel oiseau blanc est le symbole de la paix ?", "Which white bird is the symbol of peace?", "¿Qué ave blanca es el símbolo de la paz?", ["Colombe", "Dove", "Paloma"], ["Pigeon"]],
  ["general", "Combien de zéros compte un million ?", "How many zeros are there in one million?", "¿Cuántos ceros tiene un millón?", "6"],
  ["general", "Quel est le plus grand animal terrestre ?", "What is the largest land animal?", "¿Cuál es el animal terrestre más grande?", ["Éléphant", "Elephant", "Elefante"], ["Éléphant d'Afrique", "African elephant", "Elefante africano"]],
  ["general", "Quelle couleur obtient-on en mélangeant du bleu et du jaune ?", "What colour do you get by mixing blue and yellow?", "¿Qué color se obtiene mezclando azul y amarillo?", ["Vert", "Green", "Verde"]],
  ["general", "Combien de côtés possède un hexagone ?", "How many sides does a hexagon have?", "¿Cuántos lados tiene un hexágono?", "6"],
  ["general", "Combien de couleurs compte-t-on traditionnellement dans un arc-en-ciel ?", "How many colours are traditionally counted in a rainbow?", "¿Cuántos colores se cuentan tradicionalmente en un arcoíris?", "7"],

  // ---------- Géographie ----------
  ["geo", "Quelle est la capitale de l'Australie ?", "What is the capital of Australia?", "¿Cuál es la capital de Australia?", "Canberra"],
  ["geo", "Quelle est la capitale du Canada ?", "What is the capital of Canada?", "¿Cuál es la capital de Canadá?", "Ottawa"],
  ["geo", "Quelle est la capitale de la Turquie ?", "What is the capital of Turkey?", "¿Cuál es la capital de Turquía?", "Ankara"],
  ["geo", "Quelle est la capitale de la Nouvelle-Zélande ?", "What is the capital of New Zealand?", "¿Cuál es la capital de Nueva Zelanda?", "Wellington"],
  ["geo", "Quel est le plus grand océan du monde ?", "What is the largest ocean in the world?", "¿Cuál es el océano más grande del mundo?", ["Pacifique", "Pacific", "Pacífico"], ["Océan Pacifique", "Pacific Ocean", "Océano Pacífico"]],
  ["geo", "Quel est le plus grand pays du monde par sa superficie ?", "What is the largest country in the world by area?", "¿Cuál es el país más grande del mundo por superficie?", ["Russie", "Russia", "Rusia"]],
  ["geo", "Quel est le pays le plus peuplé du monde depuis 2023 ?", "Which country has had the largest population since 2023?", "¿Cuál es el país más poblado del mundo desde 2023?", ["Inde", "India", "India"], [], { checked: "2026-11", until: "2030-12-31" }],
  ["geo", "Quelle est la plus haute montagne du monde ?", "What is the highest mountain in the world?", "¿Cuál es la montaña más alta del mundo?", "Everest", ["Mont Everest", "Mount Everest", "Monte Everest"]],
  ["geo", "Dans quel pays se trouve le Machu Picchu ?", "In which country is Machu Picchu?", "¿En qué país está Machu Picchu?", ["Pérou", "Peru", "Perú"]],
  ["geo", "Quel est le plus petit pays du monde ?", "What is the smallest country in the world?", "¿Cuál es el país más pequeño del mundo?", ["Vatican", "Vatican City", "Vaticano"], ["Cité du Vatican", "Ciudad del Vaticano"]],
  ["geo", "Quel est le plus grand désert chaud du monde ?", "What is the largest hot desert in the world?", "¿Cuál es el desierto cálido más grande del mundo?", "Sahara"],

  // ---------- Histoire ----------
  ["hist", "Qui a été le premier homme à marcher sur la Lune ?", "Who was the first person to walk on the Moon?", "¿Quién fue el primer hombre en pisar la Luna?", "Neil Armstrong", ["Armstrong"]],
  ["hist", "En quelle année le mur de Berlin est-il tombé ?", "In which year did the Berlin Wall fall?", "¿En qué año cayó el muro de Berlín?", "1989"],
  ["hist", "Qui fut le premier président des États-Unis ?", "Who was the first president of the United States?", "¿Quién fue el primer presidente de Estados Unidos?", "George Washington", ["Washington"]],
  ["hist", "Quel célèbre paquebot a coulé en 1912 ?", "Which famous ocean liner sank in 1912?", "¿Qué famoso transatlántico se hundió en 1912?", "Titanic"],
  ["hist", "En quelle année Christophe Colomb a-t-il atteint l'Amérique pour la première fois ?", "In which year did Christopher Columbus first reach the Americas?", "¿En qué año llegó Cristóbal Colón a América por primera vez?", "1492"],
  ["hist", "En quelle année a commencé la Révolution française ?", "In which year did the French Revolution begin?", "¿En qué año comenzó la Revolución francesa?", "1789"],
  ["hist", "Quel empereur français a été vaincu à Waterloo ?", "Which French emperor was defeated at Waterloo?", "¿Qué emperador francés fue derrotado en Waterloo?", ["Napoléon", "Napoleon", "Napoleón"], ["Napoléon Bonaparte", "Napoleon Bonaparte", "Napoleón Bonaparte", "Napoléon Ier"]],
  ["hist", "Quelle reine d'Égypte fut l'alliée de Marc Antoine ?", "Which queen of Egypt was Mark Antony's ally?", "¿Qué reina de Egipto fue aliada de Marco Antonio?", ["Cléopâtre", "Cleopatra", "Cleopatra"]],
  ["hist", "Quelle civilisation a construit le Machu Picchu ?", "Which civilisation built Machu Picchu?", "¿Qué civilización construyó Machu Picchu?", ["Incas", "Inca", "Incas"], ["Les Incas", "Inca empire", "Inka"]],
  ["hist", "Quelle est la seule des sept merveilles du monde antique encore debout ?", "Which is the only one of the Seven Wonders of the Ancient World still standing?", "¿Cuál es la única de las siete maravillas del mundo antiguo que sigue en pie?", ["Pyramide de Khéops", "Great Pyramid of Giza", "Gran Pirámide de Guiza"], ["Pyramide de Gizeh", "Grande pyramide", "Khéops", "Kheops", "Great Pyramid", "Pyramid of Giza", "Pirámide de Keops", "Keops", "Pyramide"]],

  // ---------- Sport ----------
  ["sport", "Quel pays a remporté la Coupe du monde de football 2022 ?", "Which country won the 2022 FIFA World Cup?", "¿Qué país ganó el Mundial de fútbol de 2022?", ["Argentine", "Argentina", "Argentina"]],
  ["sport", "Combien d'anneaux compte le drapeau olympique ?", "How many rings are on the Olympic flag?", "¿Cuántos anillos tiene la bandera olímpica?", "5"],
  ["sport", "De quel pays est originaire le sprinteur Usain Bolt ?", "Which country is sprinter Usain Bolt from?", "¿De qué país es el velocista Usain Bolt?", ["Jamaïque", "Jamaica", "Jamaica"]],
  ["sport", "De quelle couleur est le maillot du leader du Tour de France ?", "What colour is the Tour de France leader's jersey?", "¿De qué color es el maillot del líder del Tour de Francia?", ["Jaune", "Yellow", "Amarillo"]],
  ["sport", "Dans quel sport réalise-t-on un « slam dunk » ?", "In which sport do you do a slam dunk?", "¿En qué deporte se hace un mate (slam dunk)?", ["Basket", "Basketball", "Baloncesto"], ["Basket-ball", "Basketball", "Básquetbol", "Basquet"]],
  ["sport", "Dans quel sport utilise-t-on un volant ?", "In which sport do you use a shuttlecock?", "¿En qué deporte se usa un volante?", "Badminton", ["Bádminton"]],
  ["sport", "Sur quelle surface se joue Roland-Garros ?", "On which surface is the French Open (Roland-Garros) played?", "¿Sobre qué superficie se juega Roland Garros?", ["Terre battue", "Clay", "Tierra batida"], ["Argile", "Arcilla"]],
  ["sport", "Combien de joueurs par équipe sont sur le terrain au volley-ball ?", "How many players per team are on the court in volleyball?", "¿Cuántos jugadores por equipo hay en la cancha en voleibol?", "6"],
  ["sport", "Au golf, comment appelle-t-on un trou réussi en un coup de moins que le par ?", "In golf, what is one stroke under par on a hole called?", "En golf, ¿cómo se llama hacer un hoyo con un golpe menos que el par?", "Birdie"],
  ["sport", "Combien de points vaut un touchdown au football américain (sans la transformation) ?", "How many points is a touchdown worth in American football (before the extra point)?", "¿Cuántos puntos vale un touchdown en fútbol americano (sin el punto extra)?", "6"],

  // ---------- Cinéma & séries ----------
  ["cine", "Qui a réalisé « Jurassic Park » (1993) ?", "Who directed \"Jurassic Park\" (1993)?", "¿Quién dirigió «Jurassic Park» (1993)?", "Steven Spielberg", ["Spielberg"]],
  ["cine", "Comment s'appelle l'école de sorcellerie dans Harry Potter ?", "What is the name of the wizarding school in Harry Potter?", "¿Cómo se llama el colegio de magia en Harry Potter?", ["Poudlard", "Hogwarts", "Hogwarts"]],
  ["cine", "Comment s'appelle le lionceau héros du « Roi Lion » ?", "What is the name of the lion cub hero of \"The Lion King\"?", "¿Cómo se llama el cachorro protagonista de «El Rey León»?", "Simba"],
  ["cine", "Quelle série raconte l'histoire d'un professeur de chimie devenu fabricant de drogue ?", "Which series follows a chemistry teacher who becomes a drug manufacturer?", "¿Qué serie cuenta la historia de un profesor de química que se convierte en fabricante de droga?", "Breaking Bad"],
  ["cine", "Comment s'appelle le cow-boy de « Toy Story » ?", "What is the name of the cowboy in \"Toy Story\"?", "¿Cómo se llama el vaquero de «Toy Story»?", "Woody"],
  ["cine", "Quel ogre vert vit dans un marais avec un âne bavard ?", "Which green ogre lives in a swamp with a talkative donkey?", "¿Qué ogro verde vive en un pantano con un burro parlanchín?", "Shrek"],
  ["cine", "Quelle série met en scène Eleven et le « monde à l'envers » ?", "Which series features Eleven and the \"Upside Down\"?", "¿Qué serie tiene a Once (Eleven) y el «Mundo del Revés»?", "Stranger Things"],
  ["cine", "Qui est le fils de Dark Vador ?", "Who is Darth Vader's son?", "¿Quién es el hijo de Darth Vader?", "Luke Skywalker", ["Luke"]],
  ["cine", "Comment s'appelle le bonhomme de neige de « La Reine des neiges » ?", "What is the name of the snowman in \"Frozen\"?", "¿Cómo se llama el muñeco de nieve de «Frozen»?", "Olaf"],
  ["cine", "Quel hobbit porte l'Anneau dans « Le Seigneur des anneaux » ?", "Which hobbit carries the Ring in \"The Lord of the Rings\"?", "¿Qué hobbit lleva el Anillo en «El Señor de los Anillos»?", "Frodon", ["Frodo", "Frodon Sacquet", "Frodo Baggins", "Frodo Bolsón"]],

  // ---------- Musique ----------
  ["music", "Quel chanteur a sorti l'album « Thriller » ?", "Which singer released the album \"Thriller\"?", "¿Qué cantante publicó el álbum «Thriller»?", "Michael Jackson", ["Jackson"]],
  ["music", "Dans quel groupe jouait John Lennon ?", "Which band was John Lennon in?", "¿En qué grupo tocaba John Lennon?", "The Beatles", ["Beatles", "Les Beatles"]],
  ["music", "Quel groupe a chanté « Bohemian Rhapsody » ?", "Which band sang \"Bohemian Rhapsody\"?", "¿Qué grupo cantó «Bohemian Rhapsody»?", "Queen"],
  ["music", "Combien de cordes a une guitare classique ?", "How many strings does a classical guitar have?", "¿Cuántas cuerdas tiene una guitarra clásica?", "6"],
  ["music", "Qui a composé « Les Quatre Saisons » ?", "Who composed \"The Four Seasons\"?", "¿Quién compuso «Las cuatro estaciones»?", "Vivaldi", ["Antonio Vivaldi"]],
  ["music", "Quel rappeur a interprété « Lose Yourself » ?", "Which rapper performed \"Lose Yourself\"?", "¿Qué rapero interpretó «Lose Yourself»?", "Eminem"],
  ["music", "Quel chanteur belge a sorti « Alors on danse » ?", "Which Belgian singer released \"Alors on danse\"?", "¿Qué cantante belga lanzó «Alors on danse»?", "Stromae"],
  ["music", "Quel groupe suédois a chanté « Dancing Queen » ?", "Which Swedish group sang \"Dancing Queen\"?", "¿Qué grupo sueco cantó «Dancing Queen»?", "ABBA"],
  ["music", "Qui a chanté « Shape of You » ?", "Who sang \"Shape of You\"?", "¿Quién cantó «Shape of You»?", "Ed Sheeran", ["Sheeran"]],
  ["music", "Quel instrument possède généralement 88 touches ?", "Which instrument usually has 88 keys?", "¿Qué instrumento tiene normalmente 88 teclas?", "Piano"],

  // ---------- Jeux vidéo ----------
  ["games", "Comment s'appelle le frère de Mario ?", "What is the name of Mario's brother?", "¿Cómo se llama el hermano de Mario?", "Luigi"],
  ["games", "Comment s'appelle le héros de la série « The Legend of Zelda » ?", "What is the name of the hero of \"The Legend of Zelda\" series?", "¿Cómo se llama el héroe de la saga «The Legend of Zelda»?", "Link"],
  ["games", "Quel Pokémon jaune électrique est la mascotte de la série ?", "Which yellow electric Pokémon is the series' mascot?", "¿Qué Pokémon amarillo eléctrico es la mascota de la saga?", "Pikachu"],
  ["games", "Dans quel jeu croise-t-on des Creepers dans un monde fait de cubes ?", "In which game do you meet Creepers in a world made of blocks?", "¿En qué juego te encuentras Creepers en un mundo de cubos?", "Minecraft"],
  ["games", "Quelle entreprise fabrique la PlayStation ?", "Which company makes the PlayStation?", "¿Qué empresa fabrica la PlayStation?", "Sony"],
  ["games", "Quel animal est Sonic ?", "What kind of animal is Sonic?", "¿Qué animal es Sonic?", ["Hérisson", "Hedgehog", "Erizo"]],
  ["games", "Quel jeu de blocs qui tombent a été créé en URSS en 1984 ?", "Which falling-block game was created in the USSR in 1984?", "¿Qué juego de bloques que caen se creó en la URSS en 1984?", "Tetris"],
  ["games", "Dans quel jeu remporte-t-on une « Victoire Royale » ?", "In which game do you win a \"Victory Royale\"?", "¿En qué juego se gana una «Victoria magistral» (Victory Royale)?", "Fortnite"],
  ["games", "De quel pays vient l'entreprise Nintendo ?", "Which country does Nintendo come from?", "¿De qué país es la empresa Nintendo?", ["Japon", "Japan", "Japón"]],
  ["games", "Dans « Among Us », comment appelle-t-on le traître ?", "In \"Among Us\", what is the traitor called?", "En «Among Us», ¿cómo se llama al traidor?", ["Imposteur", "Impostor", "Impostor"]],

  // ---------- Sciences ----------
  ["sci", "Quel est le symbole chimique de l'or ?", "What is the chemical symbol for gold?", "¿Cuál es el símbolo químico del oro?", "Au"],
  ["sci", "Quelle planète est surnommée la planète rouge ?", "Which planet is known as the Red Planet?", "¿Qué planeta es conocido como el planeta rojo?", ["Mars", "Mars", "Marte"]],
  ["sci", "Quelle est la plus grande planète du système solaire ?", "What is the largest planet in the solar system?", "¿Cuál es el planeta más grande del sistema solar?", ["Jupiter", "Jupiter", "Júpiter"]],
  ["sci", "Quelle est l'étoile la plus proche de la Terre ?", "What is the closest star to Earth?", "¿Cuál es la estrella más cercana a la Tierra?", ["Soleil", "Sun", "Sol"], ["The Sun", "El Sol"]],
  ["sci", "Quelle est la formule chimique de l'eau ?", "What is the chemical formula of water?", "¿Cuál es la fórmula química del agua?", "H2O"],
  ["sci", "Quel organe pompe le sang dans le corps ?", "Which organ pumps blood around the body?", "¿Qué órgano bombea la sangre por el cuerpo?", ["Cœur", "Heart", "Corazón"], ["Coeur"]],
  ["sci", "Quel scientifique a formulé la théorie de la relativité ?", "Which scientist developed the theory of relativity?", "¿Qué científico formuló la teoría de la relatividad?", "Albert Einstein", ["Einstein"]],
  ["sci", "Quel métal est liquide à température ambiante ?", "Which metal is liquid at room temperature?", "¿Qué metal es líquido a temperatura ambiente?", ["Mercure", "Mercury", "Mercurio"]],
  ["sci", "Quel est le matériau naturel le plus dur ?", "What is the hardest natural material?", "¿Cuál es el material natural más duro?", ["Diamant", "Diamond", "Diamante"]],
  ["sci", "Quel gaz les plantes absorbent-elles pour la photosynthèse ?", "Which gas do plants absorb for photosynthesis?", "¿Qué gas absorben las plantas para la fotosíntesis?", "CO2", ["Dioxyde de carbone", "Gaz carbonique", "Carbon dioxide", "Dióxido de carbono"]],

  // ---------- Nature & animaux ----------
  ["nature", "Quel est le plus grand animal du monde ?", "What is the largest animal in the world?", "¿Cuál es el animal más grande del mundo?", ["Baleine bleue", "Blue whale", "Ballena azul"], ["Rorqual bleu"]],
  ["nature", "Quel est l'animal terrestre le plus rapide ?", "What is the fastest land animal?", "¿Cuál es el animal terrestre más rápido?", ["Guépard", "Cheetah", "Guepardo"]],
  ["nature", "Quel ours mange principalement du bambou ?", "Which bear eats mainly bamboo?", "¿Qué oso come principalmente bambú?", "Panda", ["Panda géant", "Giant panda", "Panda gigante"]],
  ["nature", "Combien de pattes a une araignée ?", "How many legs does a spider have?", "¿Cuántas patas tiene una araña?", "8"],
  ["nature", "Quel est le plus grand oiseau du monde ?", "What is the largest bird in the world?", "¿Cuál es el ave más grande del mundo?", ["Autruche", "Ostrich", "Avestruz"]],
  ["nature", "Comment appelle-t-on le bébé de la grenouille ?", "What is a baby frog called?", "¿Cómo se llama la cría de la rana?", ["Têtard", "Tadpole", "Renacuajo"]],
  ["nature", "Quel arbre produit des glands ?", "Which tree produces acorns?", "¿Qué árbol produce bellotas?", ["Chêne", "Oak", "Roble"], ["Encina"]],
  ["nature", "Quel insecte fabrique le miel ?", "Which insect makes honey?", "¿Qué insecto fabrica la miel?", ["Abeille", "Bee", "Abeja"]],
  ["nature", "Quel lézard est célèbre pour changer de couleur ?", "Which lizard is famous for changing colour?", "¿Qué lagarto es famoso por cambiar de color?", ["Caméléon", "Chameleon", "Camaleón"]],
  ["nature", "Quel animal australien transporte son petit dans une poche ?", "Which Australian animal carries its baby in a pouch?", "¿Qué animal australiano lleva a su cría en una bolsa?", ["Kangourou", "Kangaroo", "Canguro"], ["Koala", "Wallaby"]],

  // ---------- Gastronomie ----------
  ["food", "De quel pays vient le sushi ?", "Which country does sushi come from?", "¿De qué país viene el sushi?", ["Japon", "Japan", "Japón"]],
  ["food", "Quel est l'ingrédient principal du guacamole ?", "What is the main ingredient of guacamole?", "¿Cuál es el ingrediente principal del guacamole?", ["Avocat", "Avocado", "Aguacate"], ["Palta"]],
  ["food", "De quelle ville italienne vient la pizza ?", "Which Italian city is pizza from?", "¿De qué ciudad italiana viene la pizza?", ["Naples", "Naples", "Nápoles"], ["Napoli"]],
  ["food", "De quel pays vient la paella ?", "Which country does paella come from?", "¿De qué país es la paella?", ["Espagne", "Spain", "España"]],
  ["food", "Quel fromage met-on sur une pizza Margherita ?", "Which cheese goes on a Margherita pizza?", "¿Qué queso lleva una pizza Margarita?", "Mozzarella"],
  ["food", "Avec quel légume sec prépare-t-on le houmous ?", "Which legume is hummus made from?", "¿Con qué legumbre se hace el hummus?", ["Pois chiche", "Chickpea", "Garbanzo"], ["Pois chiches", "Chickpeas", "Garbanzos"]],
  ["food", "Quelle épice très chère provient des pistils d'une fleur de crocus ?", "Which very expensive spice comes from the stigmas of a crocus flower?", "¿Qué especia muy cara proviene de los estigmas de una flor de azafrán?", ["Safran", "Saffron", "Azafrán"]],
  ["food", "Quel fruit utilise-t-on pour faire le vin ?", "Which fruit is used to make wine?", "¿Qué fruta se usa para hacer vino?", ["Raisin", "Grape", "Uva"], ["Grapes", "Uvas", "Raisins"]],
  ["food", "De quel pays vient le tiramisu ?", "Which country does tiramisu come from?", "¿De qué país es el tiramisú?", ["Italie", "Italy", "Italia"]],
  ["food", "De quelle couleur est le wasabi ?", "What colour is wasabi?", "¿De qué color es el wasabi?", ["Vert", "Green", "Verde"]],

  // ---------- Art & littérature ----------
  ["art", "Qui a peint la Joconde ?", "Who painted the Mona Lisa?", "¿Quién pintó la Mona Lisa?", ["Léonard de Vinci", "Leonardo da Vinci", "Leonardo da Vinci"], ["De Vinci", "Da Vinci", "Leonardo"]],
  ["art", "Qui a peint « La Nuit étoilée » ?", "Who painted \"The Starry Night\"?", "¿Quién pintó «La noche estrellada»?", "Vincent van Gogh", ["Van Gogh"]],
  ["art", "Qui a écrit « Roméo et Juliette » ?", "Who wrote \"Romeo and Juliet\"?", "¿Quién escribió «Romeo y Julieta»?", ["Shakespeare", "William Shakespeare", "William Shakespeare"]],
  ["art", "Qui a écrit « Les Misérables » ?", "Who wrote \"Les Misérables\"?", "¿Quién escribió «Los miserables»?", "Victor Hugo", ["Hugo"]],
  ["art", "Qui a écrit « Don Quichotte » ?", "Who wrote \"Don Quixote\"?", "¿Quién escribió «Don Quijote»?", "Miguel de Cervantes", ["Cervantes"]],
  ["art", "Qui a écrit « Le Petit Prince » ?", "Who wrote \"The Little Prince\"?", "¿Quién escribió «El principito»?", "Antoine de Saint-Exupéry", ["Saint-Exupéry", "Saint Exupery"]],
  ["art", "Qui a écrit la saga Harry Potter ?", "Who wrote the Harry Potter series?", "¿Quién escribió la saga de Harry Potter?", "J.K. Rowling", ["Rowling", "JK Rowling", "Joanne Rowling"]],
  ["art", "Quel auteur a créé Sherlock Holmes ?", "Which author created Sherlock Holmes?", "¿Qué autor creó a Sherlock Holmes?", "Arthur Conan Doyle", ["Conan Doyle"]],
  ["art", "Quel peintre espagnol a peint « Guernica » ?", "Which Spanish painter painted \"Guernica\"?", "¿Qué pintor español pintó «Guernica»?", "Pablo Picasso", ["Picasso"]],
  ["art", "Quel peintre norvégien a peint « Le Cri » ?", "Which Norwegian painter painted \"The Scream\"?", "¿Qué pintor noruego pintó «El grito»?", "Edvard Munch", ["Munch"]],
  ["art", "Quel auteur belge a créé Tintin ?", "Which Belgian author created Tintin?", "¿Qué autor belga creó a Tintín?", "Hergé", ["Herge", "Georges Remi"]],

  // ---------- Mythologie ----------
  ["myth", "Qui est le roi des dieux grecs ?", "Who is the king of the Greek gods?", "¿Quién es el rey de los dioses griegos?", "Zeus"],
  ["myth", "Quel dieu grec règne sur la mer ?", "Which Greek god rules the sea?", "¿Qué dios griego gobierna el mar?", ["Poséidon", "Poseidon", "Poseidón"]],
  ["myth", "Quel dieu nordique manie le marteau Mjöllnir ?", "Which Norse god wields the hammer Mjölnir?", "¿Qué dios nórdico empuña el martillo Mjolnir?", "Thor"],
  ["myth", "Quel héros grec a accompli douze travaux ?", "Which Greek hero performed twelve labours?", "¿Qué héroe griego realizó doce trabajos?", ["Héraclès", "Heracles", "Heracles"], ["Hercule", "Hercules", "Hércules", "Herakles"]],
  ["myth", "Quelle créature a des serpents à la place des cheveux ?", "Which creature has snakes instead of hair?", "¿Qué criatura tiene serpientes en lugar de cabello?", ["Méduse", "Medusa", "Medusa"], ["Gorgone", "Gorgon", "Gorgona"]],
  ["myth", "Quel est le dieu romain de la guerre ?", "Who is the Roman god of war?", "¿Quién es el dios romano de la guerra?", ["Mars", "Mars", "Marte"]],
  ["myth", "Quel est le dieu égyptien du Soleil ?", "Who is the Egyptian sun god?", "¿Quién es el dios egipcio del Sol?", ["Râ", "Ra", "Ra"], ["Re", "Rê"]],
  ["myth", "Comment s'appelle le cheval ailé de la mythologie grecque ?", "What is the name of the winged horse in Greek mythology?", "¿Cómo se llama el caballo alado de la mitología griega?", ["Pégase", "Pegasus", "Pegaso"]],
  ["myth", "Quelle femme a ouvert la boîte (ou jarre) qui libéra les maux du monde ?", "Which woman opened the box (or jar) that released the world's evils?", "¿Qué mujer abrió la caja (o jarra) que liberó los males del mundo?", ["Pandore", "Pandora", "Pandora"]],
  ["myth", "Sur quelle île Ulysse veut-il rentrer chez lui ?", "Which island is Odysseus trying to return home to?", "¿A qué isla quiere volver Ulises?", ["Ithaque", "Ithaca", "Ítaca"]],

  // ---------- Tech & internet ----------
  ["tech", "Qui a cofondé Microsoft avec Paul Allen ?", "Who co-founded Microsoft with Paul Allen?", "¿Quién cofundó Microsoft con Paul Allen?", "Bill Gates", ["Gates"]],
  ["tech", "Quelle entreprise fabrique l'iPhone ?", "Which company makes the iPhone?", "¿Qué empresa fabrica el iPhone?", "Apple"],
  ["tech", "Qui a fondé Facebook ?", "Who founded Facebook?", "¿Quién fundó Facebook?", "Mark Zuckerberg", ["Zuckerberg"]],
  ["tech", "Quelle entreprise développe Android ?", "Which company develops Android?", "¿Qué empresa desarrolla Android?", "Google"],
  ["tech", "Quelle plateforme de vidéos créée en 2005 appartient à Google ?", "Which video platform, created in 2005, is owned by Google?", "¿Qué plataforma de vídeos creada en 2005 pertenece a Google?", "YouTube"],
  ["tech", "Combien de bits compte un octet ?", "How many bits are in a byte?", "¿Cuántos bits tiene un byte?", "8"],
  ["tech", "Quel réseau social s'appelait Twitter avant d'être renommé ?", "Which social network was called Twitter before being renamed?", "¿Qué red social se llamaba Twitter antes de cambiar de nombre?", "X"],
  ["tech", "Que signifie « www » dans une adresse web ?", "What does \"www\" stand for in a web address?", "¿Qué significa «www» en una dirección web?", "World Wide Web"],
  ["tech", "Quel système d'exploitation a pour mascotte un manchot nommé Tux ?", "Which operating system has a penguin mascot called Tux?", "¿Qué sistema operativo tiene como mascota un pingüino llamado Tux?", "Linux"],
  ["tech", "Quel moteur de recherche a été fondé par Larry Page et Sergey Brin ?", "Which search engine was founded by Larry Page and Sergey Brin?", "¿Qué buscador fundaron Larry Page y Sergey Brin?", "Google"],

  // ---------- Manga & animé ----------
  ["manga", "Quel pirate au chapeau de paille veut devenir le roi des pirates ?", "Which straw-hat pirate wants to become King of the Pirates?", "¿Qué pirata del sombrero de paja quiere ser el Rey de los Piratas?", "Luffy", ["Monkey D. Luffy"]],
  ["manga", "Comment s'appelle le village caché de Naruto ?", "What is the name of Naruto's hidden village?", "¿Cómo se llama la aldea oculta de Naruto?", "Konoha", ["Village caché de la Feuille", "Hidden Leaf Village", "Aldea Oculta de la Hoja", "Konohagakure"]],
  ["manga", "Comment s'appelle le héros de « Dragon Ball » ?", "What is the name of the hero of \"Dragon Ball\"?", "¿Cómo se llama el protagonista de «Dragon Ball»?", "Son Goku", ["Goku", "Sangoku", "Son Gokū"]],
  ["manga", "Quel studio japonais a produit « Le Voyage de Chihiro » ?", "Which Japanese studio produced \"Spirited Away\"?", "¿Qué estudio japonés produjo «El viaje de Chihiro»?", "Studio Ghibli", ["Ghibli"]],
  ["manga", "Dans « Death Note », quel lycéen trouve le carnet ?", "In \"Death Note\", which student finds the notebook?", "En «Death Note», ¿qué estudiante encuentra la libreta?", "Light Yagami", ["Light", "Yagami"]],
  ["manga", "Comment s'appelle le héros de « L'Attaque des Titans » ?", "What is the name of the hero of \"Attack on Titan\"?", "¿Cómo se llama el protagonista de «Ataque a los Titanes»?", "Eren Jäger", ["Eren", "Eren Yeager", "Eren Jaeger"]],
  ["manga", "Comment s'appelle le dresseur de Pikachu dans l'animé Pokémon ?", "What is the name of Pikachu's trainer in the Pokémon anime?", "¿Cómo se llama el entrenador de Pikachu en el anime de Pokémon?", ["Sacha", "Ash", "Ash"], ["Ash Ketchum", "Satoshi", "Sacha Ketchum"]],
  ["manga", "Quel est le héros de « Demon Slayer » ?", "Who is the hero of \"Demon Slayer\"?", "¿Quién es el protagonista de «Guardianes de la Noche» (Demon Slayer)?", "Tanjiro", ["Tanjiro Kamado", "Tanjirō"]],
  ["manga", "Quel grand esprit de la forêt gris donne son nom à un film de Miyazaki de 1988 ?", "Which big grey forest spirit gives its name to a 1988 Miyazaki film?", "¿Qué gran espíritu gris del bosque da nombre a una película de Miyazaki de 1988?", "Totoro"],
  ["manga", "Dans « One Punch Man », combien de coups faut-il à Saitama pour vaincre un ennemi ?", "In \"One Punch Man\", how many punches does Saitama need to defeat an enemy?", "En «One Punch Man», ¿cuántos golpes necesita Saitama para vencer a un enemigo?", "1", ["Un", "One", "Uno"]],
];

Q.push(...more.Q);
for (const f of ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11"]) Q.push(...require("./xl/" + f));
const xtra = require("./xl/extra");
const seenFr = new Set();
for (let i = Q.length - 1; i >= 0; i--) { const k = Q[i][1].toLowerCase().trim(); if (seenFr.has(k)) Q.splice(i, 1); else seenFr.add(k); }
// Infos facultatives en dernier élément d'une ligne : { d: 1|2|3 (facile|moyen|difficile),
//   until: "AAAA-MM-JJ" (ne sort plus après cette date), checked: "AAAA-MM" (dernière vérification) }
const META = (row) => {
  const m = row[row.length - 1];
  return m && typeof m === "object" && !Array.isArray(m) ? { row: row.slice(0, -1), meta: m } : { row, meta: {} };
};
const withMeta = (o, m) => {
  if (m.d) o.d = m.d;
  if (m.until) o.until = m.until;
  if (m.checked) o.checked = m.checked;
  return o;
};
const quiz = [...Q.map((line) => {
  const { row: [t, fr, en, es, ans, alts = []], meta } = META(line);
  const show = Array.isArray(ans) ? { fr: ans[0], en: ans[1], es: ans[2] } : { fr: ans, en: ans, es: ans };
  return withMeta({ t, q: { fr, en, es }, show, a: [...new Set([...Object.values(show), ...alts])] }, meta);
}), ...more.extra, ...xtra.FLAGS, ...xtra.EMOJI];

// Au plus près : [question FR, EN, ES, nombre, unité FR, EN, ES]
const closest = [
  ["Combien d'os compte le squelette d'un adulte ?", "How many bones are in the adult human skeleton?", "¿Cuántos huesos tiene el esqueleto de un adulto?", 206, "os", "bones", "huesos"],
  ["Combien de touches compte un piano classique ?", "How many keys does a standard piano have?", "¿Cuántas teclas tiene un piano estándar?", 88, "touches", "keys", "teclas"],
  ["En quelle année le mur de Berlin est-il tombé ?", "In which year did the Berlin Wall fall?", "¿En qué año cayó el muro de Berlín?", 1989],
  ["Quel est le numéro atomique de l'or ?", "What is the atomic number of gold?", "¿Cuál es el número atómico del oro?", 79],
  ["Combien de chromosomes contient une cellule humaine (hors gamètes) ?", "How many chromosomes are in a human body cell (not sperm or egg)?", "¿Cuántos cromosomas tiene una célula humana (no reproductora)?", 46],
  ["En quelle année le premier homme a-t-il marché sur la Lune ?", "In which year did humans first walk on the Moon?", "¿En qué año pisó el ser humano la Luna por primera vez?", 1969],
  ["Combien de pays compte le continent africain (membres de l'ONU) ?", "How many countries are in Africa (UN members)?", "¿Cuántos países hay en África (miembros de la ONU)?", 54, "pays", "countries", "países"],
  ["Combien de dents compte la denture définitive complète d'un adulte ?", "How many teeth does a full set of adult teeth have?", "¿Cuántos dientes tiene la dentadura adulta completa?", 32],
  ["Quelle est la distance moyenne Terre-Lune en kilomètres ?", "What is the average Earth-Moon distance in kilometres?", "¿Cuál es la distancia media Tierra-Luna en kilómetros?", 384400, "km", "km", "km"],
  ["À combien de degrés Fahrenheit l'eau bout-elle au niveau de la mer ?", "At how many degrees Fahrenheit does water boil at sea level?", "¿A cuántos grados Fahrenheit hierve el agua al nivel del mar?", 212, "°F", "°F", "°F"],
  ["Combien de cases compte un échiquier ?", "How many squares are on a chessboard?", "¿Cuántas casillas tiene un tablero de ajedrez?", 64],
  ["Combien de minutes dure un match de football réglementaire (hors prolongations) ?", "How many minutes does a regular football (soccer) match last, without extra time?", "¿Cuántos minutos dura un partido de fútbol reglamentario (sin prórroga)?", 90, "min", "min", "min"],
  ["En quelle année le Titanic a-t-il coulé ?", "In which year did the Titanic sink?", "¿En qué año se hundió el Titanic?", 1912],
  ["Combien de pays sont membres de l'Union européenne depuis 2020 ?", "How many countries have been in the European Union since 2020?", "¿Cuántos países forman la Unión Europea desde 2020?", 27],
  ["Combien de Pokémon comptait la toute première génération ?", "How many Pokémon were in the very first generation?", "¿Cuántos Pokémon había en la primera generación?", 151],
  ["En quelle année est sorti le premier iPhone ?", "In which year was the first iPhone released?", "¿En qué año salió el primer iPhone?", 2007],
  ["Combien de joueurs au total sont sur un terrain de football pendant un match (sans remplaçants) ?", "How many players in total are on a football (soccer) pitch during a match?", "¿Cuántos jugadores en total hay en un campo de fútbol durante un partido?", 22],
  ["Combien de secondes compte une heure ?", "How many seconds are in an hour?", "¿Cuántos segundos tiene una hora?", 3600],
  ["En quelle année a eu lieu la première Coupe du monde de football ?", "In which year was the first FIFA World Cup held?", "¿En qué año se jugó el primer Mundial de fútbol?", 1930],
  ["Combien de pattes a un mille-pattes de l'espèce record Eumillipes persephone (découverte en 2021) ?", "How many legs does the record millipede Eumillipes persephone (discovered 2021) have?", "¿Cuántas patas tiene el milpiés récord Eumillipes persephone (descubierto en 2021)?", 1306],
  ...more.CLOSEST,
  ...xtra.CLOSEST,
  ...require("./xl/closest2"),
  ...require("./xl/closest3"),
].map((line) => {
  const { row: [fr, en, es, n, ufr = "", uen = "", ues = ""], meta } = META(line);
  return withMeta({ q: { fr, en, es }, n, u: { fr: ufr, en: uen, es: ues } }, meta);
});

module.exports = { THEMES, quiz, closest, META, withMeta };
