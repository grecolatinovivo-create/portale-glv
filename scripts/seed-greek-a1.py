#!/usr/bin/env python3
"""
seed-greek-a1.py — Greek A1.1 and A1.2 content
Follows Athenaze progression: Greek alphabet → first declension → verb paradigms → adjectives → aorist
"""

import psycopg2, json, sys

DB_URL = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def v(term, meaning, notes=None):
    d = {"term": term, "meaning": meaning}
    if notes: d["notes"] = notes
    return d

def L(tf, cs, kv, lo):
    return {"textFragment": tf, "contentSummary": cs, "keyVocabulary": kv, "learningObjectives": lo}

# ─── GRECO A1.1 — 13 lezioni ─────────────────────────────────────────────────
# IDs in sortOrder sequence
GR_A11 = [
  # [1] Introduzione al corso  id: b06d20bc-afae-46fb-aa5c-aee4a1730f17
  L(
    "Ἡ Ἑλλάς ἐστιν ἐν τῇ Εὐρώπῃ. Ἀθῆναι πόλις μεγάλη ἐστίν. Ἡ θάλαττα περὶ τὴν Ἑλλάδα ἐστίν. Σπάρτη καὶ Κόρινθος ἐν τῇ Ἑλλάδι εἰσίν.",
    "Lezione introduttiva al greco antico: si presenta la lingua, la sua scrittura e il mondo che la esprime. Si introduce l'alfabeto greco e le prime parole geografiche. Lo studente incontra il sistema di scrittura come primo passo verso la comprensione della lingua.",
    [v("Ἑλλάς, -άδος","Grecia (III decl. femm.)"), v("ἐστίν","è (3ª sing. di εἰμί)"), v("εἰσίν","sono (3ª pl. di εἰμί)"), v("πόλις, -εως","città (III decl. femm.)"), v("μεγάλη","grande (femm. di μέγας)"), v("θάλαττα","mare"), v("περί + acc.","intorno a"), v("Ἀθῆναι","Atene (pl. tant.)"), v("καί","e, anche"), v("ἐν + dat.","in (stato in luogo)")],
    "Lo studente impara l'alfabeto greco (lettere maiuscole e minuscole). Legge le prime parole greche riconoscendo i caratteri. Comprende il sistema di scrittura come diverso da quello latino. Identifica nomi geografici del mondo greco."
  ),
  # [2] Lezione 1  id: d154d77b-175a-46da-9949-5a9456f6d240
  L(
    "Ὁ Φίλιππος ἄνθρωπός ἐστιν. Ἡ Μέλιττα γυνή ἐστιν. Ὁ Φίλιππος γεωργός ἐστιν· ἐν ἀγρῷ ἐργάζεται. Ἡ δὲ Μέλιττα ἐν τῇ οἰκίᾳ μένει.",
    "La lezione presenta la famiglia greca protagonista del corso (Filippo e Melitta). Si introduce il sistema degli articoli greci (ὁ, ἡ, τό) come marcatori di genere. Si osserva la differenza di ruoli tra le figure maschili e femminili nel mondo greco. Vocabolario: famiglia, attività quotidiane.",
    [v("ἄνθρωπος","uomo, essere umano (II decl. masch.)"), v("γυνή, -αικός","donna, moglie (III decl. irr.)"), v("γεωργός","contadino, agricoltore"), v("ἀγρός","campo (II decl.)"), v("ἐργάζεται","lavora (dep. ἐργάζομαι)"), v("οἰκία","casa (I decl.)"), v("μένει","rimane, resta (μένω)"), v("ὁ / ἡ / τό","articolo determinativo m./f./n."), v("δέ","ma, invece (postpositivo)"), v("ἐν + dat.","in (stato in luogo)")],
    "Lo studente usa correttamente l'articolo greco (ὁ, ἡ, τό). Legge frasi nominali semplici con il verbo εἰμί. Comprende il lessico della famiglia e delle attività quotidiane. Distingue il genere grammaticale greco."
  ),
  # [3] Lezione 2  id: 8aed79ab-fedd-4c5b-8659-5c98b37bbd05
  L(
    "Ὁ Φίλιππος υἱὸν ἔχει· ὁ υἱὸς Δικαιόπολίς ἐστιν. Ὁ Δικαιόπολις νεανίας ἐστίν. Ὁ νεανίας τὸν πατέρα φιλεῖ καὶ ἐν τῷ ἀγρῷ αὐτῷ βοηθεῖ.",
    "La lezione introduce il figlio Diceopoli come secondo personaggio centrale. Si lavora sull'accusativo come caso del complemento oggetto (τὸν πατέρα). Si osserva la differenza tra nominativo e accusativo nei nomi della I e II declinazione. Compaiono i verbi φιλέω (contratto) e βοηθέω.",
    [v("υἱός","figlio (II decl.)"), v("ἔχει","ha, possiede (ἔχω)"), v("νεανίας","giovane (I decl. masch.)"), v("πατήρ, πατρός","padre (III decl. irr.)"), v("φιλεῖ","ama (φιλέω, verbo contratto)"), v("βοηθεῖ","aiuta (βοηθέω + dat.)"), v("αὐτῷ","a lui (dat. sing. di αὐτός)"), v("τόν","accusativo masch. sing. dell'articolo"), v("νεανίαν","giovane (acc. sing., I decl.)"), v("καί","e")],
    "Lo studente riconosce l'accusativo come caso del complemento oggetto. Usa i verbi contratti in -έω al presente. Comprende la costruzione βοηθέω + dativo. Legge frasi con due personaggi in relazione."
  ),
  # [4] Lezione 3  id: 21a1f374-807e-45ea-82ee-2a373f5a97e6
  L(
    "Ὁ Δικαιόπολις πρὸς τὴν πόλιν βαδίζει. Ἐν τῇ ὁδῷ ἄλλους ἀνθρώπους ὁρᾷ. Παρὰ τὴν ὁδὸν κρήνη ἐστίν· ἐκεῖ πολλαὶ γυναῖκες ὑδρίας φέρουσιν.",
    "Diceopoli cammina verso la città. La lezione introduce il moto a luogo (πρός + acc.) e la descrizione di scene di vita quotidiana. Si osservano i verbi di movimento (βαδίζω, ὁράω, φέρω) e i sostantivi al plurale (γυναῖκες, ὑδρίας). Vocabolario: città, strade, attività.",
    [v("βαδίζει","cammina (βαδίζω)"), v("πρός + acc.","verso (moto a luogo)"), v("ὁδός","strada, via (II decl. femm.)"), v("ὁρᾷ","vede (ὁράω, contratto)"), v("ἄλλος/η/ο","altro/a"), v("κρήνη","fonte, fontana (I decl.)"), v("ἐκεῖ","lì, là (avv.)"), v("ὑδρία","anfora per l'acqua"), v("φέρουσιν","portano (φέρω, 3ª pl.)"), v("παρά + acc.","lungo, accanto a")],
    "Lo studente usa πρός + accusativo per il moto a luogo. Comprende i verbi contratti in -άω (ὁράω → ὁρᾷ). Legge descrizioni di scene urbane in greco. Riconosce il plurale della I e II declinazione."
  ),
  # [5] Lezione 4  id: 2a369c5e-2d7b-43c2-8552-e5b6e5f2467c
  L(
    "Ἐν τῇ ἀγορᾷ πολλοί ἄνθρωποί εἰσιν. Ὁ Δικαιόπολις ἄρτον ὠνεῖται· ὁ γὰρ ἄρτος καλός ἐστιν. Ἔπειτα πρὸς τὸν ἰατρὸν βαδίζει· ὁ πατὴρ γὰρ νοσεῖ.",
    "Diceopoli all'agorà: le prime transazioni commerciali e la vita pubblica ateniese. Si introduce il γάρ come particella esplicativa (postpositivo). Il verbo ὠνέομαι come esempio di verbo in -έομαι. Contesto culturale: l'agorà come cuore della polis greca.",
    [v("ἀγορά","agorà, piazza del mercato (I decl.)"), v("ἄρτος","pane (II decl.)"), v("ὠνεῖται","compra (ὠνέομαι, dep. contratto)"), v("γάρ","infatti, perché (postpositivo)"), v("καλός/ή/όν","bello, buono"), v("ἔπειτα","poi, dopo (avv.)"), v("ἰατρός","medico"), v("νοσεῖ","è malato (νοσέω)"), v("πολλοί","molti (pl. di πολύς)"), v("εἰσιν","sono (3ª pl. di εἰμί)")],
    "Lo studente comprende la funzione della particella postpositiva γάρ. Usa ὠνέομαι come verbo deponente. Legge dialoghi ambientati nell'agorà. Conosce il ruolo dell'agorà nella vita della polis."
  ),
  # [6] Lezione 5  id: f79aac81-cf6d-49c8-bc36-6998f1d5a63e
  L(
    "Ὁ ἰατρὸς τὸν Φίλιππον σκοπεῖ καὶ λέγει· 'Ὁ πατήρ σου σφόδρα νοσεῖ. Μένε οἴκοι καὶ τὸν πατέρα θεράπευε.' Ὁ Δικαιόπολις ἀθυμεῖ ἀλλὰ ὑπακούει.",
    "Il dialogo con il medico. Si introduce il discorso diretto in greco e i comandi all'imperativo (μένε, θεράπευε). Si osserva σου come genitivo del pronome personale (di te = tuo). Vocabolario medico del mondo antico.",
    [v("σκοπεῖ","esamina, osserva (σκοπέω)"), v("λέγει","dice (λέγω)"), v("σου","di te (gen. sing. di σύ)"), v("σφόδρα","molto, fortemente (avv.)"), v("μένε","rimani! (imper. di μένω)"), v("οἴκοι","a casa (dat. di luogo)"), v("θεράπευε","cura! (imper. di θεραπεύω)"), v("ἀθυμεῖ","è scoraggiato (ἀθυμέω)"), v("ἀλλά","ma, però"), v("ὑπακούει","obbedisce (ὑπακούω + dat.)")],
    "Lo studente riconosce e usa l'imperativo presente in greco. Comprende il genitivo del pronome personale (σου = di te/tuo). Legge un dialogo con discorso diretto. Conosce il lessico medico del mondo antico."
  ),
  # [7] Lezione 6  id: 1ad002ab-8dbf-4879-8ee5-5ddaef0ac180
  L(
    "Ἐν τῇ οἰκίᾳ θυγάτηρ ἐστίν· Φιλουμένη ὄνομα αὐτῇ. Ἡ Φιλουμένη τὸν οἶκον καθαρίζει καὶ σῖτον μαγειρεύει. Ἡ μήτηρ αὐτῆς ἀσθενεῖ.",
    "La sorella Filumena e la vita domestica femminile. Si introduce il dativo di possesso (ὄνομα αὐτῇ = il nome per lei = si chiama). Si lavora sul genitivo (αὐτῆς = di lei = sua). Vocabolario della vita domestica e delle attività femminili nel mondo greco.",
    [v("θυγάτηρ, -τρός","figlia (III decl. irr.)"), v("ὄνομα αὐτῇ","il nome per lei = si chiama (dat. poss.)"), v("οἶκος","casa, famiglia (II decl.)"), v("καθαρίζει","pulisce (καθαρίζω)"), v("σῖτος","grano, cibo (II decl.)"), v("μαγειρεύει","cucina (μαγειρεύω)"), v("μήτηρ, -τρός","madre (III decl. irr.)"), v("αὐτῆς","di lei, sua (gen. sing. femm.)"), v("ἀσθενεῖ","è malata (ἀσθενέω)")],
    "Lo studente comprende il dativo di possesso (ὄνομα αὐτῇ). Usa il genitivo del pronome αὐτός come aggettivo possessivo. Legge descrizioni della vita domestica. Conosce il vocabolario delle attività quotidiane femminili."
  ),
  # [8] Lezione 7  id: bdb0e16c-a0de-4646-96b0-aad1dac245ca
  L(
    "Ὁ Δικαιόπολις οἴκαδε ἐπανέρχεται. Ὁ πατὴρ ἐν τῇ κλίνῃ κεῖται. Ὁ Δικαιόπολις αὐτὸν ἀσπάζεται καὶ λέγει· 'Τί πάσχεις, ὦ πάτερ;' Ὁ Φίλιππος ὀλίγον λέγειν δύναται.",
    "Il ritorno a casa e la scena del padre malato. Si introduce la domanda diretta con τί (che cosa?). Si lavora sul vocativo come caso di invocazione (ὦ πάτερ). Compare il verbo δύναμαι come verbo irregolare frequente. Contesto culturale: la malattia nella famiglia greca.",
    [v("οἴκαδε","a casa (moto a luogo, avv.)"), v("ἐπανέρχεται","ritorna (ἐπανέρχομαι, dep.)"), v("κλίνη","letto, lettino (I decl.)"), v("κεῖται","giace, è disteso (κεῖμαι)"), v("ἀσπάζεται","saluta, abbraccia (ἀσπάζομαι)"), v("τί;","che cosa? (pron. interr. neutro)"), v("πάσχεις","stai subendo? soffri? (πάσχω)"), v("ὦ πάτερ","o padre! (voc. con interiezione ὦ)"), v("ὀλίγον","poco (acc. avv.)"), v("δύναται","può (δύναμαι, irr.)")],
    "Lo studente usa τί come pronome interrogativo neutro. Riconosce il vocativo con ὦ come formula di invocazione. Comprende δύναμαι come verbo irregolare. Legge una scena drammatica in famiglia."
  ),
  # [9] Lezione 8  id: 2a0bcdfa-472e-4046-8663-63b598b420eb
  L(
    "Ἡ νὺξ μακρά ἐστιν. Ὁ Δικαιόπολις οὐ καθεύδει ἀλλὰ τὸν πατέρα φυλάττει. Ἕωθεν δὲ ὁ πατὴρ βελτίων ἐστίν. Ὁ Δικαιόπολις χαίρει καὶ τοῖς θεοῖς εὔχεται.",
    "La notte di veglia e la preghiera agli dèi. Si introduce il comparativo (βελτίων = migliore). Compare εὔχομαι come verbo deponente che regge il dativo (τοῖς θεοῖς). Contesto culturale: il rapporto con gli dèi nella vita quotidiana greca.",
    [v("νύξ, νυκτός","notte (III decl. femm.)"), v("μακρός/ά/όν","lungo, grande"), v("καθεύδει","dorme (καθεύδω)"), v("φυλάττει","sorveglia, custodisce (φυλάττω)"), v("ἕωθεν","all'alba, di mattina presto (avv.)"), v("βελτίων, -ον","migliore (comparativo di ἀγαθός)"), v("χαίρει","si rallegra, gioisce (χαίρω)"), v("θεοί","dèi (pl. di θεός)"), v("εὔχεται","prega, fa voto (εὔχομαι + dat.)")],
    "Lo studente comprende il comparativo degli aggettivi (βελτίων). Usa εὔχομαι come verbo deponente con dativo. Legge una narrazione notturna con climax positivo. Conosce il rapporto tra uomini e dèi nel mondo greco."
  ),
  # [10] Lezione 9  id: 13d2e0c3-cb6d-4d3e-9dc8-e9c72279cf68
  L(
    "Ὁ Φίλιππος ὑγιαίνει. Βούλεται εἰς τὸν ἀγρὸν ἐλθεῖν ἀλλὰ ὁ ἰατρὸς κελεύει αὐτὸν οἴκοι μένειν. Ὁ Δικαιόπολις οὖν εἰς τὸν ἀγρὸν ἀπέρχεται καὶ τὴν γῆν ἐργάζεται.",
    "Il padre guarisce: recupero e ripresa del lavoro. Si introduce l'infinito presente come complemento di verbi come βούλομαι (volere) e κελεύω (ordinare). Compare εἰς + acc. per il moto a luogo. Vocabolario: terra, lavoro agricolo.",
    [v("ὑγιαίνει","sta bene, è sano (ὑγιαίνω)"), v("βούλεται","vuole (βούλομαι, dep.)"), v("εἰς + acc.","in, verso (moto a luogo)"), v("ἐλθεῖν","andare (inf. aor. di ἔρχομαι)"), v("κελεύει","ordina (κελεύω + acc. + inf.)"), v("οὖν","dunque, quindi (postpositivo)"), v("ἀπέρχεται","se ne va, parte (ἀπέρχομαι)"), v("γῆ","terra (I decl.)"), v("ἐργάζεται","lavora (ἐργάζομαι + acc.)")],
    "Lo studente usa βούλομαι + infinito e κελεύω + acc. + infinito. Distingue εἰς + acc. (moto a) da ἐν + dat. (stato in). Comprende gli infiniti come complemento verbale. Legge la ripresa delle attività dopo la malattia."
  ),
  # [11] Lezione 10  id: 917ed4bd-dd8e-4bc7-8c26-785118009aa2
  L(
    "Ἐν τῷ ἀγρῷ ὁ Δικαιόπολις τοὺς βοῦς ἄγει. Οἱ βόες μεγάλοι εἰσίν. Ξανθίας ὁ δοῦλος βοηθεῖ. Τὴν γῆν ἀροῦσιν. Ὁ ἥλιος καίει· σφόδρα πονοῦσιν.",
    "Il lavoro nei campi con i buoi e lo schiavo Sanzia. Si introduce il plurale della III declinazione (βόες, pl. di βοῦς). Si osserva la forma plurale del verbo (ἀροῦσιν, πονοῦσιν). Contesto culturale: la schiavitù nel mondo greco antico.",
    [v("βοῦς, βοός","bue, vacca (II decl. irreg.)"), v("ἄγει","conduce, guida (ἄγω)"), v("βόες","buoi (nom. pl. di βοῦς)"), v("Ξανθίας","Sanzia (nome tipico di schiavo)"), v("δοῦλος","schiavo"), v("ἀροῦσιν","arano (ἀρόω, contratto, 3ª pl.)"), v("ἥλιος","sole"), v("καίει","brucia, scotta (καίω)"), v("πονοῦσιν","faticano (πονέω, contratto, 3ª pl.)"), v("σφόδρα","molto (avv.)")],
    "Lo studente declina βοῦς come sostantivo irregolare. Comprende i verbi contratti in -όω (ἀρόω, πονόω) al plurale. Legge una scena di lavoro agricolo. Conosce il ruolo degli schiavi nel mondo greco."
  ),
  # [12] Lezione 11  id: 7648c6b9-8d5a-46e3-8267-8a75dc67742a
  L(
    "Εἰς τὸ ἄστυ ἀφικνοῦνται. Ἐν τῇ ἀγορᾷ πολλοὶ πολῖται ὁράωνται. Ὁ Δικαιόπολις κηρύκα ὁρᾷ· ὁ κήρυξ λέγει ὅτι Περικλῆς δημηγορήσει. Πάντες ἐπὶ τὴν Πνύκα τρέχουσιν.",
    "Arrivo in città e l'assemblea popolare. Si introduce la proposizione completiva con ὅτι. Contesto culturale fondamentale: l'ecclesia ateniese, la Pnice come luogo delle assemblee. Si incontra Pericle come figura storica.",
    [v("ἄστυ, -εως","città (III decl. neutro)"), v("ἀφικνοῦνται","arrivano (ἀφικνέομαι, dep.)"), v("πολίτης, -ου","cittadino (I decl. masch.)"), v("κήρυξ, -υκος","araldo, banditore (III decl.)"), v("ὅτι","che (congiunzione completiva)"), v("Περικλῆς","Pericle (nome storico)"), v("δημηγορήσει","parlerà al popolo (δημηγορέω, fut.)"), v("Πνύξ, Πνυκός","Pnice (collina delle assemblee)"), v("τρέχουσιν","corrono (τρέχω, 3ª pl.)")],
    "Lo studente comprende ὅτι come congiunzione completiva. Conosce il sistema democratico ateniese (ecclesia, pnice). Usa il futuro indicativo di verbi comuni. Legge un testo con riferimento storico."
  ),
  # [13] Lezione 12  id: 73180fc3-9d3a-48cc-ad3f-3d2ceb8f70aa
  L(
    "Ὁ Δικαιόπολις ἐν τῇ Πνυκὶ ἀκούει. Ὁ Περικλῆς λέγει ὅτι δεῖ τοὺς Ἀθηναίους τοὺς Λακεδαιμονίους νικᾶν. Ὁ δῆμος ἐπαινεῖ. Ὁ Δικαιόπολις οἴκαδε ἐπανέρχεται — νῦν γεωργὸς εἶναι οὐ βούλεται.",
    "Lezione conclusiva del livello A1.1: la fine del discorso di Pericle e la trasformazione di Diceopoli. Si consolida l'uso di δεῖ + infinito (bisogna + inf.) come costrutto impersonale. Revisione generale del livello.",
    [v("ἀκούει","ascolta (ἀκούω + gen. o acc.)"), v("δεῖ + inf.","bisogna, è necessario (impers.)"), v("Ἀθηναῖοι","Ateniesi (pl.)"), v("Λακεδαιμόνιοι","Spartani/Lacedemoni"), v("νικᾶν","vincere (inf. pres. di νικάω)"), v("δῆμος","popolo, demos"), v("ἐπαινεῖ","approva, applaude (ἐπαινέω)"), v("νῦν","ora, adesso"), v("εἶναι","essere (inf. di εἰμί)"), v("βούλεται","vuole (βούλομαι)")],
    "Lo studente usa δεῖ + infinito come costrutto impersonale. Consolida tutte le strutture grammaticali dell'A1.1. Comprende un discorso politico semplice in greco. Riconosce il contesto storico della rivalità Atene-Sparta."
  ),
]

# ─── GRECO A1.2 — 12 lezioni ─────────────────────────────────────────────────
GR_A12 = [
  # [1] id: e24d7d32-69c9-4ca2-902f-1c7f3c2da3e4
  L(
    "Μῦθος: Λέων καὶ Μῦς. Λέων ποτε ἐκάθευδεν. Μῦς δὲ διέδραμεν ἐπὶ τὸν λέοντα. Ὁ λέων ἠγέρθη καὶ τὸν μῦν ἔλαβεν. Ὁ δὲ μῦς ἐδεήθη· 'Ἄφες με — ποτε σοί βοηθήσω.'",
    "Il livello A1.2 inizia con una favola esopica adattata (Il leone e il topo). Si introduce l'aoristo indicativo attivo come tempo narrativo del passato puntuale. Si osservano le desinenze dell'aoristo sigmático (-σα, -σας, -σε). Confronto sistematico con il presente.",
    [v("λέων, -οντος","leone (III decl.)"), v("μῦς, μυός","topo (III decl.)"), v("ἐκάθευδεν","dormiva (imperf. di καθεύδω)"), v("διέδραμεν","corse attraverso (aor. di διατρέχω)"), v("ἠγέρθη","si svegliò (aor. pass. di ἐγείρω)"), v("ἔλαβεν","prese (aor. di λαμβάνω)"), v("ἐδεήθη","supplicò (aor. dep. di δέομαι)"), v("ἄφες","lascia! (aor. imper. di ἀφίημι)"), v("βοηθήσω","aiuterò (fut. di βοηθέω)")],
    "Lo studente riconosce l'aoristo indicativo come tempo del passato puntuale. Distingue presente (azione continua) da aoristo (azione puntuale). Legge una favola esopica adattata. Comprende la promessa come atto linguistico."
  ),
  # [2] id: d861c968-a498-4693-8cab-e037d1a0ddec
  L(
    "Ὕστερον ὁ λέων ἐν δικτύῳ εἴχετο. Ὁ μῦς ἦλθεν καὶ τὸ δίκτυον ἔτρωξεν. Ὁ λέων ἐλύθη. 'Εὖ ἐποίησας, ὦ μῦ,' εἶπεν ὁ λέων. Ὁ μῦθος δηλοῖ ὅτι χάρις χάριν τίκτει.",
    "La continuazione della favola: il topo mantiene la promessa. Si consolida l'aoristo con verbi irregolari (ἦλθεν, εἶπεν, ἐλύθη). Si introduce la morale della favola come struttura narrativa conclusiva. Locuzione proverbiale: χάρις χάριν τίκτει.",
    [v("ὕστερον","dopo, più tardi (avv.)"), v("δίκτυον","rete (II decl. neutro)"), v("εἴχετο","era tenuto, era intrappolato (pass.)"), v("ἔτρωξεν","rosicchiò (aor. di τρώγω)"), v("ἐλύθη","fu liberato (aor. pass. di λύω)"), v("εἶπεν","disse (aor. irr. di λέγω)"), v("δηλοῖ","mostra, indica (δηλόω)"), v("χάρις","grazia, gratitudine (III decl. femm.)"), v("τίκτει","genera, produce (τίκτω)")],
    "Lo studente comprende l'aoristo passivo in -θη. Usa aoristi irregolari frequenti (ἦλθεν, εἶπεν). Legge la morale di una favola greca. Riconosce la struttura narrativa della favola esopica."
  ),
  # [3] id: b0241c62-5355-4706-83fa-cc90fb1d9343
  L(
    "Ὅμηρος ἐποίησεν Ἰλιάδα καὶ Ὀδύσσειαν. Ἐν τῇ Ἰλιάδι Ἀχιλλεὺς μάχεται. Ἐν δὲ τῇ Ὀδυσσείᾳ Ὀδυσσεὺς πολλὰ πάσχει καὶ οἴκαδε νοστεῖ. Ἄμφω μεγάλα ποιήματα εἰσίν.",
    "Introduzione a Omero: Iliade e Odissea. Si lavora sull'aoristo di ποιέω (ἐποίησεν). Si introduce ἄμφω (entrambi) come duale. Contesto letterario: Omero come fondamento della paideia greca. Il lessico del genere epico.",
    [v("Ὅμηρος","Omero (poeta epico)"), v("ἐποίησεν","compose, scrisse (aor. di ποιέω)"), v("Ἰλιάς, -άδος","Iliade"), v("Ὀδύσσεια","Odissea"), v("Ἀχιλλεύς, -έως","Achille (III decl. irr.)"), v("μάχεται","combatte (μάχομαι, dep.)"), v("νοστεῖ","fa ritorno (νοστέω)"), v("ἄμφω","entrambi (duale)"), v("ποίημα, -ατος","poema (III decl. neutro)")],
    "Lo studente conosce Omero come fondamento della letteratura greca. Comprende la differenza tematica tra Iliade e Odissea. Usa ἄμφω come forma duale. Legge un testo descrittivo sulla letteratura epica."
  ),
  # [4] id: d0c1a4e7-2030-4a18-b112-fad2ef231ef8
  L(
    "Ὁ Ὀδυσσεὺς ἐκ Τροίας ἀπέπλευσεν. Ἐν τῇ θαλάττῃ πολλοὶ κίνδυνοι ἦσαν. Ὁ Κύκλωψ τοὺς ἑταίρους τοῦ Ὀδυσσέως κατέφαγεν. Ὁ δὲ Ὀδυσσεὺς ἀεὶ ἐβούλετο οἴκαδε ἐλθεῖν.",
    "Episodi dell'Odissea: il Ciclope. Si lavora sull'imperfetto come tempo della narrazione di sfondo (ἦσαν, ἐβούλετο) in contrasto con l'aoristo puntuale (ἀπέπλευσεν, κατέφαγεν). Contesto mitologico: Polifemo.",
    [v("ἀπέπλευσεν","salpò, partì per mare (aor. di ἀποπλέω)"), v("κίνδυνος","pericolo"), v("ἦσαν","erano (imperf. di εἰμί)"), v("Κύκλωψ, -ωπος","Ciclope"), v("ἑταῖρος","compagno"), v("κατέφαγεν","divorò (aor. di κατεσθίω)"), v("ἀεί","sempre"), v("ἐβούλετο","voleva (imperf. di βούλομαι)")],
    "Lo studente usa l'imperfetto per le azioni di sfondo narrativo. Distingue imperfetto (azione durata) da aoristo (azione puntuale) in una narrazione. Conosce gli episodi principali dell'Odissea. Legge un testo mitico adattato."
  ),
  # [5] id: be3591bb-891b-4605-ac41-f9e3becac244
  L(
    "Σωκράτης ἐν ταῖς Ἀθήναις ᾤκει. Τοὺς νέους ἐδίδασκεν. Ἠρώτα· 'Τί ἐστιν ἡ ἀρετή;' Οἱ δὲ νέοι ἀπεκρίνοντο. Σωκράτης οὐδέποτε ἀπεκρίνετο ἀλλὰ μόνον ἠρώτα.",
    "Socrate e il metodo maieutico. Si lavora sull'imperfetto come tempo dell'azione ripetuta o abitudinale (ἐδίδασκεν, ἠρώτα = era solito insegnare, era solito chiedere). Contesto culturale: Socrate, la maieutica, la filosofia greca.",
    [v("Σωκράτης","Socrate (nome proprio)"), v("ᾤκει","abitava (imperf. di οἰκέω)"), v("νέοι","giovani (pl. di νέος)"), v("ἐδίδασκεν","insegnava (imperf. di διδάσκω)"), v("ἠρώτα","chiedeva (imperf. di ἐρωτάω)"), v("ἀρετή","virtù, eccellenza"), v("ἀπεκρίνοντο","rispondevano (imperf. dep. di ἀποκρίνομαι)"), v("οὐδέποτε","mai"), v("μόνον","solo, soltanto")],
    "Lo studente comprende l'imperfetto come tempo dell'azione ripetuta/abitudinale. Conosce Socrate e il metodo maieutico. Usa οὐδέποτε come negazione rafforzata. Legge un testo sulla filosofia ateniese."
  ),
  # [6] id: cad5a3b2-6b9b-4043-b035-6eee5ea9a5f6
  L(
    "Ἡρόδοτος ἔγραψεν Ἱστορίαν. Λέγει ὅτι οἱ Πέρσαι τὴν Ἑλλάδα ἐνίκησαν πρότερον ἀλλ' οἱ Ἕλληνες ἐν Σαλαμῖνι ἐνίκησαν. Μεγάλη ναυμαχία ἦν.",
    "Erodoto e le Guerre Persiane. Si introduce ὅτι in dipendenza da λέγει (discorso indiretto). Si lavora sulla sintassi della proposizione completiva. Contesto storico: la battaglia di Salamina (480 a.C.) come svolta delle Guerre Persiane.",
    [v("Ἡρόδοτος","Erodoto (storico)"), v("ἔγραψεν","scrisse (aor. di γράφω)"), v("ἱστορία","ricerca, storia"), v("Πέρσαι","Persiani"), v("ἐνίκησαν","vinsero (aor. di νικάω)"), v("πρότερον","prima, in precedenza (avv.)"), v("Ἕλληνες","Greci"), v("Σαλαμίς, -ῖνος","Salamina"), v("ναυμαχία","battaglia navale"), v("ἦν","era (imperf. di εἰμί)")],
    "Lo studente comprende la costruzione λέγει ὅτι + indicativo (discorso indiretto in greco). Conosce Erodoto e le Guerre Persiane. Usa πρότερον come avverbio temporale. Legge un testo storiografico semplice."
  ),
  # [7] id: 67dae69e-324c-445d-9553-6e7e9b2bc4b7
  L(
    "Θουκυδίδης ἔγραψεν περὶ τοῦ Πελοποννησιακοῦ πολέμου. Λέγει ὅτι ἔγραψεν τὴν ἱστορίαν ἵνα οἱ ἄνθρωποι τὰ αὐτὰ πάθωσιν εἰδῶσιν. Σαφὴς καὶ ἀκριβής ἐστιν.",
    "Tucidide e la Guerra del Peloponneso. Si introduce ἵνα + congiuntivo come proposizione finale. Si lavora sugli aggettivi predicativi (σαφής, ἀκριβής). Contesto storico-letterario: il metodo storiografico di Tucidide.",
    [v("Θουκυδίδης","Tucidide (storico)"), v("Πελοποννησιακός πόλεμος","Guerra del Peloponneso"), v("ἵνα + cong.","affinché, perché (finale)"), v("πάθωσιν","abbiano sofferto (cong. aor. di πάσχω)"), v("εἰδῶσιν","sappiano (cong. perf. di οἶδα)"), v("σαφής, -ές","chiaro, perspicuo (III decl.)"), v("ἀκριβής, -ές","preciso, esatto"), v("τὰ αὐτά","le stesse cose (acc. pl.)")],
    "Lo studente comprende ἵνα + congiuntivo come proposizione finale. Usa aggettivi della III declinazione in -ης (σαφής, ἀκριβής). Conosce il metodo storiografico di Tucidide. Legge un testo di prosa storiografica."
  ),
  # [8] id: a69fa529-eb38-4c2e-9ffb-58e77c2dc1cd
  L(
    "Ἐν τῷ θεάτρῳ οἱ Ἀθηναῖοι τραγῳδίας ἐθεώρουν. Ὁ Σοφοκλῆς ἐδίδαξεν Οἰδίπουν Τύραννον. Ὁ Οἰδίπους τὸν πατέρα ἔκτεινεν οὐκ εἰδώς. Τραγικὴ εἱμαρμένη ἐστίν.",
    "Il teatro greco: la tragedia. Si introduce il participio presente come forma aggettivale (εἰδώς = sapendo / non sapendo). Si lavora sul lessico del teatro. Contesto culturale: Sofocle e l'Edipo Re come capolavoro tragico.",
    [v("θέατρον","teatro"), v("τραγῳδία","tragedia"), v("ἐθεώρουν","guardavano (imperf. di θεωρέω)"), v("Σοφοκλῆς","Sofocle"), v("ἐδίδαξεν","mise in scena (aor. di διδάσκω — teatro)"), v("Οἰδίπους","Edipo"), v("ἔκτεινεν","uccise (aor. di κτείνω)"), v("εἰδώς","sapendo (part. perf. di οἶδα)"), v("οὐκ εἰδώς","non sapendo, inconsapevolmente"), v("εἱμαρμένη","destino, fato (part. perf. pass. sostant.)")],
    "Lo studente riconosce il participio come forma aggettivale/avverbiale. Comprende l'εἰδώς come participio irregolare di οἶδα. Conosce Sofocle e l'Edipo Re. Legge un testo sulla tragedia greca."
  ),
  # [9] id: 302427ae-ec20-45d7-8f26-31cba8346fd9
  L(
    "Πλάτων ἔγραψεν Διαλόγους. Ἐν τῷ Φαίδωνι Σωκράτης λέγει ὅτι ἡ ψυχὴ ἀθάνατός ἐστιν. 'Ὁ φιλόσοφος,' φησίν, 'ἀεὶ ἀποθνῄσκειν μελετᾷ.'",
    "Platone e i Dialoghi: il Fedone. Si introduce φημί come verbo dichiarativo alternativo a λέγω. Si lavora sulla proposizione completiva con ὅτι + indicativo. Contesto filosofico: l'immortalità dell'anima in Platone.",
    [v("Πλάτων, -ωνος","Platone (filosofo)"), v("Φαίδων","Fedone (dialogo platonico)"), v("ψυχή","anima, vita"), v("ἀθάνατος/ον","immortale"), v("φησίν","dice (φημί, 3ª sing.)"), v("ἀποθνῄσκειν","morire (inf. pres. di ἀποθνῄσκω)"), v("μελετᾷ","si esercita in, pratica (μελετάω)"), v("φιλόσοφος","filosofo"), v("ἀεί","sempre"), v("ὅτι + indic.","che (proposizione completiva)")],
    "Lo studente usa φημί come verbo dichiarativo. Comprende la proposizione completiva con ὅτι + indicativo. Conosce il tema dell'immortalità dell'anima in Platone. Legge un testo filosofico adattato."
  ),
  # [10] id: 12778aa9-3319-4fc3-8147-5af2b7362997
  L(
    "Ἐν ταῖς Ὀλυμπίαις ἀγῶνες ἦσαν. Οἱ ἀθληταὶ ἔτρεχον, ἐπάλαιον, ἔρριπτον δίσκον. Ὁ νικήσας στέφανον ἔλαβεν. Μεγίστη τιμὴ ἦν τῷ νικήσαντι.",
    "I Giochi Olimpici e l'atletismo greco. Si introduce il participio aoristo (νικήσας = colui che ha vinto) e il participio aoristo al dativo (νικήσαντι = al vincitore). Contesto culturale: i giochi panellenici come sistema religioso e competitivo.",
    [v("Ὀλύμπια","Olimpia (sede dei giochi)"), v("ἀγών, -ῶνος","gara, competizione (III decl.)"), v("ἀθλητής, -οῦ","atleta (I decl. masch.)"), v("ἔτρεχον","correvano (imperf. di τρέχω)"), v("ἐπάλαιον","lottavano (imperf. di παλαίω)"), v("ἔρριπτον","lanciavano (imperf. di ῥίπτω)"), v("δίσκος","disco"), v("νικήσας","colui che ha vinto (part. aor. di νικάω)"), v("στέφανος","corona, ghirlanda"), v("τιμή","onore")],
    "Lo studente riconosce il participio aoristo come equivalente di 'colui che ha fatto'. Comprende il participio aoristo in diversi casi (nom., dat.). Conosce i Giochi Olimpici antichi. Legge un testo sullo sport nel mondo greco."
  ),
  # [11] id: 1add7bf4-459f-4b5e-a072-3a76d3452da1
  L(
    "Ἀλέξανδρος ὁ Μέγας εἰς τὴν Ἀσίαν ἐστράτευσεν. Τοὺς Πέρσας ἐνίκησεν. Ἕως τῆς Ἰνδίας ἦλθεν. Οἱ στρατιῶται δὲ κοπιῶντες ἐδεήθησαν αὐτοῦ ἐπιστρέψαι.",
    "Alessandro Magno e la spedizione in Asia. Si consolida il participio presente con valore causale-concessivo (κοπιῶντες = poiché erano stanchi). Si lavora sull'aoristo di ἐπιστρέφω. Contesto storico: Alessandro e la diffusione dell'ellenismo.",
    [v("Ἀλέξανδρος ὁ Μέγας","Alessandro il Grande"), v("ἐστράτευσεν","mosse guerra (aor. di στρατεύω)"), v("ἕως + gen.","fino a (prep.)"), v("Ἰνδία","India"), v("στρατιώτης, -ου","soldato"), v("κοπιῶντες","stanchi, affaticati (part. pres. di κοπιάω)"), v("ἐδεήθησαν","supplicarono (aor. dep. di δέομαι)"), v("αὐτοῦ","di lui, lui (gen.)"), v("ἐπιστρέψαι","fare ritorno (aor. inf. di ἐπιστρέφω)")],
    "Lo studente comprende il participio presente con valore causale. Usa ἕως + genitivo per esprimere limite. Conosce Alessandro Magno e l'ellenismo. Legge un testo storico con costruzione δέομαι + gen. + inf."
  ),
  # [12] id: 721ee5b1-6ed6-4774-adb9-2df9ff69aee4
  L(
    "Ἀνακεφαλαίωσις καὶ πρόοδος. Ὁ Δικαιόπολις νῦν πολλὰ οἶδεν. Ἔμαθεν τοὺς ἥρωας, τοὺς θεούς, τοὺς φιλοσόφους. Τώρα ἕτοιμός ἐστιν πρὸς τὸ Α2.1 προχωρεῖν.",
    "Lezione conclusiva A1.2: bilancio e revisione. Si consolida l'uso del participio, dell'aoristo, dell'imperfetto in testi narrativi. Si fa un riepilogo degli autori e dei contesti culturali incontrati nel livello. Preparazione al livello A2.1.",
    [v("ἀνακεφαλαίωσις","ricapitolazione, riassunto"), v("πρόοδος","avanzamento, progresso"), v("οἶδεν","sa, conosce (οἶδα, perfetto di senso presente)"), v("ἔμαθεν","imparò (aor. di μανθάνω)"), v("ἥρως, -ωος","eroe (III decl. irr.)"), v("ἕτοιμος/η/ον","pronto"), v("προχωρεῖν","avanzare, procedere (inf. di προχωρέω)")],
    "Lo studente consolida tutte le strutture grammaticali dell'A1.2. Riconosce il participio in funzione nominale e avverbiale. Comprende un testo di bilancio e revisione. È pronto per il livello A2.1."
  ),
]

# ─── IDs ────────────────────────────────────────────────────────────────────
IDS_GR_A11 = [
  "b06d20bc-afae-46fb-aa5c-aee4a1730f17",
  "d154d77b-175a-46da-9949-5a9456f6d240",
  "8aed79ab-fedd-4c5b-8659-5c98b37bbd05",
  "21a1f374-807e-45ea-82ee-2a373f5a97e6",
  "2a369c5e-2d7b-43c2-8552-e5b6e5f2467c",
  "f79aac81-cf6d-49c8-bc36-6998f1d5a63e",
  "1ad002ab-8dbf-4879-8ee5-5ddaef0ac180",
  "bdb0e16c-a0de-4646-96b0-aad1dac245ca",
  "2a0bcdfa-472e-4046-8663-63b598b420eb",
  "13d2e0c3-cb6d-4d3e-9dc8-e9c72279cf68",
  "917ed4bd-dd8e-4bc7-8c26-785118009aa2",
  "7648c6b9-8d5a-46e3-8267-8a75dc67742a",
  "73180fc3-9d3a-48cc-ad3f-3d2ceb8f70aa",
]
IDS_GR_A12 = [
  "e24d7d32-69c9-4ca2-902f-1c7f3c2da3e4",
  "d861c968-a498-4693-8cab-e037d1a0ddec",
  "b0241c62-5355-4706-83fa-cc90fb1d9343",
  "d0c1a4e7-2030-4a18-b112-fad2ef231ef8",
  "be3591bb-891b-4605-ac41-f9e3becac244",
  "cad5a3b2-6b9b-4043-b035-6eee5ea9a5f6",
  "67dae69e-324c-445d-9553-6e7e9b2bc4b7",
  "a69fa529-eb38-4c2e-9ffb-58e77c2dc1cd",
  "302427ae-ec20-45d7-8f26-31cba8346fd9",
  "12778aa9-3319-4fc3-8147-5af2b7362997",
  "1add7bf4-459f-4b5e-a072-3a76d3452da1",
  "721ee5b1-6ed6-4774-adb9-2df9ff69aee4",
]

def run():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    total = 0

    for ids, data, label in [
        (IDS_GR_A11, GR_A11, "gr-a11"),
        (IDS_GR_A12, GR_A12, "gr-a12"),
    ]:
        assert len(ids) == len(data), f"{label}: {len(ids)} ids vs {len(data)} records"
        for lid, lesson in zip(ids, data):
            cur.execute("""
                UPDATE "Lesson"
                SET "textFragment"       = %s,
                    "contentSummary"     = %s,
                    "keyVocabulary"      = %s::jsonb,
                    "learningObjectives" = %s
                WHERE id = %s
            """, (
                lesson["textFragment"],
                lesson["contentSummary"],
                json.dumps(lesson["keyVocabulary"], ensure_ascii=False),
                lesson["learningObjectives"],
                lid
            ))
            total += 1
        print(f"  ✓ {label}: {len(data)} lezioni aggiornate")

    conn.commit()
    conn.close()
    print(f"\nTotale aggiornato: {total} lezioni")

if __name__ == "__main__":
    run()
