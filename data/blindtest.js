// SAFIO Blind Test : listes de chansons (informations seulement : titre, artiste, année, œuvre).
// AUCUN fichier audio ici. En mode Soirée, la musique vient de l'abonnement de l'organisateur (le DJ).
// Ces listes restent côté serveur : les téléphones ne reçoivent la réponse qu'à la révélation.
//
// Format d'une chanson :
//   t    : titre (texte, ou { fr, en, es } quand le titre change selon la langue)
//   a    : artiste (null si plusieurs versions : Disney doublé, etc.)
//   y    : année (année de sortie du titre ; année du film quand il y a une œuvre « w »)
//   w    : œuvre d'origine { fr, en, es } (film, série, dessin animé)
//   alt  : autres titres acceptés ; altA : autres artistes acceptés ; altW : autres noms d'œuvre acceptés
//   inst : true pour un thème instrumental (le nom du film est accepté comme titre)

const CATS = ["y70", "y80", "y90", "y00", "y10", "films", "disney", "frcult"];
// Ce qu'on demande par défaut (format « Auto »)
const AUTO = { films: ["work"], disney: ["work"] };

const row = (t, a, y, more = {}) => ({ t, a, y, ...more });
const W = (fr, en, es) => ({ fr, en: en || fr, es: es || en || fr });

const SONGS = {
  y70: [
    row("Dancing Queen", "ABBA", 1976),
    row("Stayin' Alive", "Bee Gees", 1977),
    row("I Will Survive", "Gloria Gaynor", 1978),
    row("Bohemian Rhapsody", "Queen", 1975),
    row("Y.M.C.A.", "Village People", 1978, { alt: ["YMCA"] }),
    row("Rasputin", "Boney M.", 1978),
    row("Hotel California", "Eagles", 1977, { altA: ["The Eagles"] }),
    row("I Feel Love", "Donna Summer", 1977),
    row("September", "Earth, Wind & Fire", 1978, { altA: ["Earth Wind and Fire"] }),
    row("Le Freak", "Chic", 1978),
    row("We Will Rock You", "Queen", 1977),
    row("Crocodile Rock", "Elton John", 1972),
    row("Starman", "David Bowie", 1972),
    row("Stairway to Heaven", "Led Zeppelin", 1971),
    row("Alexandrie Alexandra", "Claude François", 1978),
    row("L'Été indien", "Joe Dassin", 1975, { alt: ["L'Ete indien"] }),
    row("The Logical Song", "Supertramp", 1979),
    row("ABC", "The Jackson 5", 1970, { altA: ["Jackson 5", "Jackson Five"] }),
    row("Sweet Home Alabama", "Lynyrd Skynyrd", 1974),
    row("Another Brick in the Wall (Part 2)", "Pink Floyd", 1979),
  ],
  y80: [
    row("Billie Jean", "Michael Jackson", 1983),
    row("Beat It", "Michael Jackson", 1983),
    row("Take On Me", "a-ha", 1985, { altA: ["aha"] }),
    row("Like a Virgin", "Madonna", 1984),
    row("Girls Just Want to Have Fun", "Cyndi Lauper", 1983),
    row("The Final Countdown", "Europe", 1986),
    row("Livin' on a Prayer", "Bon Jovi", 1986, { alt: ["Living on a Prayer"] }),
    row("Africa", "Toto", 1982),
    row("Eye of the Tiger", "Survivor", 1982),
    row("I Wanna Dance with Somebody (Who Loves Me)", "Whitney Houston", 1987),
    row("Another One Bites the Dust", "Queen", 1980),
    row("Kids in America", "Kim Wilde", 1981),
    row("Never Gonna Give You Up", "Rick Astley", 1987),
    row("Money for Nothing", "Dire Straits", 1985),
    row("Wake Me Up Before You Go-Go", "Wham!", 1984, { altA: ["Wham"] }),
    row("Everybody Wants to Rule the World", "Tears for Fears", 1985),
    row("With or Without You", "U2", 1987),
    row("Voyage, voyage", "Desireless", 1986),
    row("L'Aventurier", "Indochine", 1982),
    row("Celebration", "Kool & the Gang", 1980, { altA: ["Kool and the Gang"] }),
    row("L'Aziza", "Daniel Balavoine", 1985),
    row("Sweet Dreams (Are Made of This)", "Eurythmics", 1983),
  ],
  y90: [
    row("Smells Like Teen Spirit", "Nirvana", 1991),
    row("...Baby One More Time", "Britney Spears", 1998, { alt: ["Baby One More Time"] }),
    row("Wannabe", "Spice Girls", 1996),
    row("I Want It That Way", "Backstreet Boys", 1999),
    row("What Is Love", "Haddaway", 1993),
    row("It's My Life", "Dr. Alban", 1992, { altA: ["Dr Alban", "Doctor Alban"] }),
    row("Blue (Da Ba Dee)", "Eiffel 65", 1998),
    row("Wonderwall", "Oasis", 1995),
    row("I Will Always Love You", "Whitney Houston", 1992),
    row("Livin' la Vida Loca", "Ricky Martin", 1999, { alt: ["Living la Vida Loca"] }),
    row("You Oughta Know", "Alanis Morissette", 1995),
    row("Gangsta's Paradise", "Coolio feat. L.V.", 1995),
    row("Barbie Girl", "Aqua", 1997),
    row("Losing My Religion", "R.E.M.", 1991, { altA: ["REM"] }),
    row("No Limit", "2 Unlimited", 1993, { altA: ["Two Unlimited"] }),
    row("All That She Wants", "Ace of Base", 1992),
    row("Mambo No. 5 (A Little Bit of...)", "Lou Bega", 1999, { alt: ["Mambo No 5", "Mambo Number 5", "Mambo numero 5"] }),
    row("Désenchantée", "Mylène Farmer", 1991),
    row("Freed from Desire", "Gala", 1996),
    row("Rhythm Is a Dancer", "Snap!", 1992, { altA: ["Snap"] }),
    row("No Scrubs", "TLC", 1999),
  ],
  y00: [
    row("Crazy in Love", "Beyoncé feat. Jay-Z", 2003),
    row("Hey Ya!", "OutKast", 2003),
    row("Lose Yourself", "Eminem", 2002),
    row("Oops!... I Did It Again", "Britney Spears", 2000, { alt: ["Oops I Did It Again"] }),
    row("Hips Don't Lie", "Shakira feat. Wyclef Jean", 2006),
    row("Umbrella", "Rihanna feat. Jay-Z", 2007),
    row("Poker Face", "Lady Gaga", 2008),
    row("I Gotta Feeling", "The Black Eyed Peas", 2009, { altA: ["Black Eyed Peas", "BEP"] }),
    row("One More Time", "Daft Punk", 2000),
    row("Aserejé (The Ketchup Song)", "Las Ketchup", 2002, { alt: ["Asereje", "The Ketchup Song", "Ketchup Song"] }),
    row("Can't Get You Out of My Head", "Kylie Minogue", 2001),
    row("Crazy", "Gnarls Barkley", 2006),
    row("Rehab", "Amy Winehouse", 2006),
    row("Seven Nation Army", "The White Stripes", 2003),
    row("In the End", "Linkin Park", 2001),
    row("SexyBack", "Justin Timberlake", 2006, { alt: ["Sexy Back"] }),
    row("Viva la Vida", "Coldplay", 2008),
    row("Sex on Fire", "Kings of Leon", 2008),
    row("Whenever, Wherever", "Shakira", 2001),
    row("La Boulette", "Diam's", 2006),
    row("Moi... Lolita", "Alizée", 2000, { alt: ["Moi Lolita"] }),
    row("Love Generation", "Bob Sinclar", 2005),
  ],
  y10: [
    row("Happy", "Pharrell Williams", 2013, { altA: ["Pharrell"] }),
    row("Uptown Funk", "Mark Ronson feat. Bruno Mars", 2014),
    row("Rolling in the Deep", "Adele", 2010),
    row("Somebody That I Used to Know", "Gotye feat. Kimbra", 2011),
    row("Gangnam Style", "PSY", 2012),
    row("Get Lucky", "Daft Punk feat. Pharrell Williams", 2013),
    row("Despacito", "Luis Fonsi feat. Daddy Yankee", 2017),
    row("Shape of You", "Ed Sheeran", 2017),
    row("Papaoutai", "Stromae", 2013),
    row("Party Rock Anthem", "LMFAO", 2011),
    row("Wake Me Up", "Avicii", 2013),
    row("Blinding Lights", "The Weeknd", 2019),
    row("Bad Guy", "Billie Eilish", 2019),
    row("Believer", "Imagine Dragons", 2017),
    row("Roar", "Katy Perry", 2013),
    row("Lean On", "Major Lazer & DJ Snake feat. MØ", 2015, { altA: ["Major Lazer", "DJ Snake"] }),
    row("Sapés comme jamais", "Maître Gims", 2015, { altA: ["Gims"] }),
    row("Prayer in C", "Lilly Wood and the Prick & Robin Schulz", 2014, { altA: ["Lilly Wood and the Prick", "Robin Schulz", "Lilly Wood"] }),
    row("Andalouse", "Kendji Girac", 2014, { altA: ["Kendji"] }),
    row("Waka Waka (This Time for Africa)", "Shakira", 2010),
    row("Diamonds", "Rihanna", 2012),
  ],
  films: [
    row("Star Wars – Main Title", "John Williams", 1977, { inst: true, w: W("Star Wars", "Star Wars", "Star Wars"), altW: ["La Guerre des étoiles", "La guerra de las galaxias"] }),
    row("Jaws – Main Title", "John Williams", 1975, { inst: true, w: W("Les Dents de la mer", "Jaws", "Tiburón") }),
    row("Jurassic Park – Theme", "John Williams", 1993, { inst: true, w: W("Jurassic Park", "Jurassic Park", "Parque Jurásico") }),
    row({ fr: "Le thème d'Hedwige", en: "Hedwig's Theme", es: "Hedwig's Theme" }, "John Williams", 2001, { inst: true, w: W("Harry Potter"), alt: ["Hedwig's Theme"] }),
    row("He's a Pirate", "Klaus Badelt", 2003, { inst: true, altA: ["Hans Zimmer"], w: W("Pirates des Caraïbes", "Pirates of the Caribbean", "Piratas del Caribe") }),
    row("My Heart Will Go On", "Céline Dion", 1997, { w: W("Titanic") }),
    row("Take My Breath Away", "Berlin", 1986, { w: W("Top Gun") }),
    row("Gonna Fly Now", "Bill Conti", 1976, { inst: true, w: W("Rocky") }),
    row("Ghostbusters", "Ray Parker Jr.", 1984, { w: W("SOS Fantômes", "Ghostbusters", "Los cazafantasmas"), altA: ["Ray Parker Junior"] }),
    row("The Pink Panther Theme", "Henry Mancini", 1963, { inst: true, w: W("La Panthère rose", "The Pink Panther", "La pantera rosa") }),
    row("James Bond Theme", "Monty Norman", 1962, { inst: true, altA: ["John Barry"], w: W("James Bond") }),
    row("Mission: Impossible – Theme", "Lalo Schifrin", 1966, { inst: true, w: W("Mission impossible", "Mission: Impossible", "Misión imposible") }),
    row("The Good, the Bad and the Ugly – Main Theme", "Ennio Morricone", 1966, { inst: true, w: W("Le Bon, la Brute et le Truand", "The Good, the Bad and the Ugly", "El bueno, el feo y el malo") }),
    row("Back to the Future – Main Theme", "Alan Silvestri", 1985, { inst: true, w: W("Retour vers le futur", "Back to the Future", "Regreso al futuro") }),
    row("Raiders March", "John Williams", 1981, { inst: true, w: W("Indiana Jones"), altW: ["Les Aventuriers de l'arche perdue", "Raiders of the Lost Ark", "En busca del arca perdida"] }),
    row("Game of Thrones – Main Title", "Ramin Djawadi", 2011, { inst: true, w: W("Game of Thrones", "Game of Thrones", "Juego de tronos") }),
    row("I'll Be There for You", "The Rembrandts", 1994, { w: W("Friends") }),
    row("The Simpsons – Main Title", "Danny Elfman", 1989, { inst: true, w: W("Les Simpson", "The Simpsons", "Los Simpson") }),
    row("Stranger Things – Main Title", "Kyle Dixon & Michael Stein", 2016, { inst: true, w: W("Stranger Things") }),
    row("(I've Had) The Time of My Life", "Bill Medley & Jennifer Warnes", 1987, { alt: ["The Time of My Life", "Time of My Life"], w: W("Dirty Dancing") }),
    row("Concerning Hobbits", "Howard Shore", 2001, { inst: true, w: W("Le Seigneur des anneaux", "The Lord of the Rings", "El Señor de los Anillos") }),
    row("Skyfall", "Adele", 2012, { w: W("Skyfall"), altW: ["James Bond"] }),
  ],
  disney: [
    row("Hakuna Matata", null, 1994, { w: W("Le Roi lion", "The Lion King", "El rey león") }),
    row({ fr: "L'Histoire de la vie", en: "Circle of Life", es: "El ciclo de la vida" }, null, 1994, { alt: ["El ciclo sin fin"], w: W("Le Roi lion", "The Lion King", "El rey león") }),
    row({ fr: "Je voudrais déjà être roi", en: "I Just Can't Wait to Be King", es: "Yo voy a ser el rey león" }, null, 1994, { w: W("Le Roi lion", "The Lion King", "El rey león") }),
    row({ fr: "L'amour brille sous les étoiles", en: "Can You Feel the Love Tonight", es: "Esta noche es para amar" }, null, 1994, { w: W("Le Roi lion", "The Lion King", "El rey león") }),
    row({ fr: "Libérée, délivrée", en: "Let It Go", es: "Libre soy" }, null, 2013, { alt: ["Suéltalo"], w: W("La Reine des neiges", "Frozen", "Frozen") }),
    row({ fr: "Dans un autre monde", en: "Into the Unknown", es: "Mucho más allá" }, null, 2019, { w: W("La Reine des neiges II", "Frozen II", "Frozen II"), altW: ["La Reine des neiges 2", "Frozen 2", "La Reine des neiges"] }),
    row({ fr: "Ce rêve bleu", en: "A Whole New World", es: "Un mundo ideal" }, null, 1992, { w: W("Aladdin") }),
    row({ fr: "Je suis ton meilleur ami", en: "Friend Like Me", es: "Friend Like Me" }, null, 1992, { w: W("Aladdin") }),
    row({ fr: "Je suis ton ami", en: "You've Got a Friend in Me", es: "Yo soy tu amigo fiel" }, null, 1995, { alt: ["Hay un amigo en mí"], w: W("Toy Story") }),
    row({ fr: "Le Bleu Lumière", en: "How Far I'll Go", es: "Cuán lejos voy" }, null, 2016, { alt: ["Hasta dónde llegaré"], w: W("Vaiana", "Moana", "Vaiana"), altW: ["Moana", "Vaiana, la légende du bout du monde"] }),
    row({ fr: "Sous l'océan", en: "Under the Sea", es: "Bajo el mar" }, null, 1989, { w: W("La Petite Sirène", "The Little Mermaid", "La sirenita") }),
    row({ fr: "Histoire éternelle", en: "Beauty and the Beast", es: "Beauty and the Beast" }, null, 1991, { w: W("La Belle et la Bête", "Beauty and the Beast", "La bella y la bestia") }),
    row({ fr: "Il en faut peu pour être heureux", en: "The Bare Necessities", es: "Busca lo más vital" }, null, 1967, { w: W("Le Livre de la jungle", "The Jungle Book", "El libro de la selva") }),
    row({ fr: "Ne m'oublie pas", en: "Remember Me", es: "Recuérdame" }, null, 2017, { w: W("Coco") }),
    row({ fr: "Ne parlons pas de Bruno", en: "We Don't Talk About Bruno", es: "No se habla de Bruno" }, null, 2021, { w: W("Encanto") }),
    row("All Star", "Smash Mouth", 2001, { w: W("Shrek") }),
    row("Heigh-Ho", null, 1937, { alt: ["Hi Ho", "Heigh Ho", "Hé ho"], w: W("Blanche-Neige et les Sept Nains", "Snow White and the Seven Dwarfs", "Blancanieves y los siete enanitos"), altW: ["Blanche-Neige", "Snow White", "Blancanieves"] }),
    row("Bibbidi-Bobbidi-Boo", null, 1950, { w: W("Cendrillon", "Cinderella", "La Cenicienta") }),
    row("Supercalifragilisticexpialidocious", null, 1964, { w: W("Mary Poppins") }),
    row({ fr: "L'Air du vent", en: "Colors of the Wind", es: "Colores en el viento" }, null, 1995, { w: W("Pocahontas") }),
  ],
  frcult: [
    row("La Vie en rose", "Édith Piaf", 1947),
    row("Non, je ne regrette rien", "Édith Piaf", 1960),
    row("Ne me quitte pas", "Jacques Brel", 1959),
    row("La Bohème", "Charles Aznavour", 1965),
    row("Les Champs-Élysées", "Joe Dassin", 1969),
    row("Et moi, et moi, et moi", "Jacques Dutronc", 1966),
    row("Les Lacs du Connemara", "Michel Sardou", 1981),
    row("Que je t'aime", "Johnny Hallyday", 1969),
    row("Ella, elle l'a", "France Gall", 1987),
    row("Je te donne", "Jean-Jacques Goldman & Michael Jones", 1985, { altA: ["Goldman", "Jean-Jacques Goldman", "Michael Jones"] }),
    row("Je l'aime à mourir", "Francis Cabrel", 1979),
    row("Mistral gagnant", "Renaud", 1985),
    row("Comme d'habitude", "Claude François", 1967, { altA: ["Cloclo"] }),
    row("On ira tous au paradis", "Michel Polnareff", 1972),
    row("Un autre monde", "Téléphone", 1984),
    row("Alors on danse", "Stromae", 2009),
    row("Je veux", "Zaz", 2010),
    row("Il est où le bonheur", "Christophe Maé", 2016),
    row("Dernière danse", "Indila", 2013),
    row("Marcia Baila", "Les Rita Mitsouko", 1984, { altA: ["Rita Mitsouko"] }),
    row("Et maintenant", "Gilbert Bécaud", 1961),
    row("Une belle histoire", "Michel Fugain", 1972, { altA: ["Michel Fugain et le Big Bazar"] }),
  ],
};

// Langues ajoutées (néerlandais, allemand…) : noms locaux dans data/i18n/<langue>/blindtest.js
// (clé = nom anglais). Sans nom local, on garde le nom anglais (titre original).
{
  const fs = require("fs"), path = require("path"), I18N = require("./i18n");
  for (const lang of I18N.LANGS) {
    const f = path.join(__dirname, "i18n", lang, "blindtest.js");
    const D = fs.existsSync(f) ? require(f) : {};
    for (const s of Object.values(SONGS).flat()) {
      for (const k of ["t", "w"]) {
        const o = s[k];
        if (!o || typeof o !== "object") continue;
        const loc = ((k === "t" ? D.titles : D.works) || {})[o.en] || [];
        o[lang] = loc[0] || o.en;
        if (loc.length > 1) {
          const key = k === "t" ? "alt" : "altW";
          s[key] = [...new Set([...(s[key] || []), ...loc.slice(1)])];
        }
      }
      for (const t of s.altW || []) if ((D.works || {})[t]) s.altW = [...new Set([...s.altW, ...D.works[t]])];
    }
  }
}

// On aplatit : chaque chanson connaît sa catégorie
const ALL = [];
for (const c of CATS) for (const s of SONGS[c]) { s.c = c; ALL.push(s); }

module.exports = { CATS, AUTO, SONGS, ALL };
