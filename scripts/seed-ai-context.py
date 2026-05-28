#!/usr/bin/env python3
"""
seed-ai-context.py
Popola textFragment, contentSummary, keyVocabulary, learningObjectives
per TUTTE le lezioni del portale GrecoLatinoVivo.
Segue le progressioni reali di: LLPSI (Latino), Athenaze (Greco),
grammatiche standard di Ebraico Biblico ed Egiziano Medio.
"""

import psycopg2
import json
import sys

DB_URL = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ── Helper ────────────────────────────────────────────────────────────────────
def v(term, meaning, notes=None):
    d = {"term": term, "meaning": meaning}
    if notes:
        d["notes"] = notes
    return d

def L(tf, cs, kv, lo):
    return {"textFragment": tf, "contentSummary": cs, "keyVocabulary": kv, "learningObjectives": lo}

# ─────────────────────────────────────────────────────────────────────────────
# LATINO A1.1  — LLPSI Familia Romana, Cap. 1–12
# ─────────────────────────────────────────────────────────────────────────────
LAT_A11 = [
  L(
    "Rōma in Italiā est. Italia in Eurōpā est. Graecia quoque in Eurōpā est. Hispania et Gallia in Eurōpā sunt. Sicilia insula in marī est. Aegyptus nōn in Eurōpā sed in Āfricā est. Nīlus fluvius magnus in Āfricā est.",
    "La lezione introduce la lingua latina attraverso la geografia del mondo antico. Gli studenti incontrano le prime frasi nominali con il verbo esse e imparano a leggere nomi di luoghi familiari in forma latina. Si introduce il concetto di caso nominativo e la distinzione singolare/plurale.",
    [v("Rōma","Roma","capitale dell'impero, nom. sing."), v("Italia","Italia"), v("est","è (3ª sing. di esse)"), v("sunt","sono (3ª pl. di esse)"), v("in","in, su (+ ablativo = stato in luogo)"), v("et","e"), v("quoque","anche"), v("insula","isola"), v("marē","mare (abl. sing.)"), v("fluvius","fiume")],
    "Lo studente riconosce le forme base del verbo esse (est/sunt). Legge frasi nominali semplici in latino. Comprende il concetto di caso nominativo. Identifica nomi geografici del mondo romano."
  ),
  L(
    "Iūlius vir Rōmānus est. Aemilia fēmina Rōmāna est. Iūlius et Aemilia maritus et uxor sunt. Mārcus fīlius eōrum est; Iūlia fīlia est. Dāvus servus in familiā est. Familia Iūliī in villā magnā habitat.",
    "La lezione presenta la famiglia di Giulio, nucleo narrativo del corso. Si introduce la I e II declinazione nominativo, il concetto di genere grammaticale (maschile/femminile), e i primi aggettivi con accordo. Si incontra il genitivo di appartenenza (Iūliī = di Giulio).",
    [v("vir","uomo, marito"), v("fēmina","donna"), v("maritus","marito"), v("uxor","moglie"), v("fīlius","figlio","II decl., nom. sing."), v("fīlia","figlia","I decl., nom. sing."), v("servus","schiavo"), v("familia","famiglia"), v("villa","villa, casa di campagna"), v("habitat","abita, vive (3ª sing. di habitāre)")],
    "Lo studente riconosce i membri della famiglia in latino. Comprende il genitivo di appartenenza. Legge frasi con soggetto e predicato nominale. Distingue maschile e femminile nella I e II declinazione."
  ),
  L(
    "Mārcus puer bonus est. Mārcus patrem et mātrem amat. Pater fīlium vocat: 'Mārce, venī!' Mārcus ad patrem currit et eum salutat. 'Salvē, pater!' Pater fīlium amplectitur et laetus est.",
    "La lezione introduce l'accusativo come caso del complemento oggetto. Compaiono i primi verbi transitivi (amat, vocat, salutat) e si osserva la differenza tra nominativo (soggetto) e accusativo (oggetto). Si incontra anche il vocativo come caso di invocazione diretta.",
    [v("puer","ragazzo, bambino"), v("bonus","buono (nom. sing. masch.)"), v("pater","padre (nom. sing.)"), v("patrem","padre (acc. sing.)"), v("amat","ama (3ª sing.)"), v("vocat","chiama"), v("currit","corre"), v("salutat","saluta"), v("venī","vieni! (imperativo)"), v("salvē","salve!, ciao!")],
    "Lo studente comprende la funzione dell'accusativo come complemento oggetto. Distingue nominativo e accusativo nelle frasi. Riconosce il vocativo come forma di invocazione. Usa correttamente i verbi transitivi di base."
  ),
  L(
    "Mārcus librum habet. Liber bonus est. Mārcus librum legit et multa discit. Quīntus quoque discipulus est sed librum nōn amat. Quīntus in hortō lūdere māvult. Magister puerōs in scholam vocat: 'Intrāte et sedēte!'",
    "La lezione amplia il lessico della vita quotidiana (scuola, libri, giochi) e introduce la negazione con nōn. Si consolida l'uso di nominativo e accusativo in frasi più articolate. Compare il verbo mālle (preferire) come esempio di verbo irregolare frequente.",
    [v("liber","libro"), v("habet","ha, possiede"), v("legit","legge"), v("discit","impara"), v("nōn","non (negazione)"), v("hortus","giardino"), v("lūdit","gioca"), v("māvult","preferisce (mālle)"), v("magister","maestro, insegnante"), v("schola","scuola")],
    "Lo studente usa la negazione nōn correttamente. Legge frasi più lunghe con più azioni. Comprende il lessico della vita scolastica romana. Riconosce la struttura soggetto-oggetto-verbo tipica del latino."
  ),
  L(
    "Mārcus Iūliae rōsam dat. Iūlia gaudet et Mārcō grātiās agit. Pater fīliīs pōmum dat. Māter fīliae stolam pulchram dat. Servus dominō cibum parat et in mēnsā pōnit. Omnia bene sunt in familiā Iūliī.",
    "La lezione introduce il dativo come caso del complemento di termine. Si osserva la triplice struttura soggetto–dativo–accusativo in frasi del tipo 'X dà qualcosa a Y'. Si incontra la prima declinazione al dativo (Iūliae, fīliae) e la seconda (Mārcō, dominō).",
    [v("dat","dà (3ª sing. di dare)"), v("rōsa","rosa"), v("gaudet","gioisce, è felice"), v("grātiās agit","ringrazia (lett. 'fa grazie')"), v("pōmum","frutto, mela"), v("stola","stola (veste femminile)"), v("pulcher/pulchra","bello/bella"), v("cibus","cibo"), v("mēnsa","tavola"), v("dominus","padrone, signore")],
    "Lo studente riconosce il dativo come caso del destinatario. Costruisce frasi con tre elementi: soggetto, dativo, accusativo. Comprende le desinenze -ae (I decl.) e -ō (II decl.) al dativo singolare."
  ),
  L(
    "Villa Iūliī in collibus est, procul ab urbe Rōmā. In villā multī servī labōrant. Sub arboribus magnīs pueri lūdunt. Prope villam aqua ē fonte currit. Per agrōs viā longa dūcit ad villam vīcīnōrum.",
    "La lezione è dedicata all'ablativo con preposizioni di luogo: in (stato), sub, prope, ē/ex (provenienza), per (moto attraverso). Si introduce la distinzione tra stato in luogo e moto a luogo. Il lessico riguarda paesaggio rurale e vita in villa.",
    [v("collis","colle (abl. pl.: collibus)"), v("procul ab","lontano da (+ abl.)"), v("sub","sotto (+ abl.)"), v("arbor","albero (3ª decl.)"), v("prope","vicino a (+ acc.)"), v("ē / ex","da, fuori da (+ abl.)"), v("fons","fonte, sorgente"), v("per","attraverso (+ acc.)"), v("ager","campo"), v("vīcīnus","vicino, confinante")],
    "Lo studente usa le principali preposizioni con ablativo. Distingue stato in luogo (in + abl.) da moto a luogo (in + acc.). Legge descrizioni di luoghi in latino. Comprende il lessico del paesaggio rurale romano."
  ),
  L(
    "In Italiā multae villae et multī agrī sunt. Servī in agrīs labōrant et frūmentum colligunt. Ancillae in culinā cibum parant. Fīliī dominōrum in scholā discunt. Virī in forō conveniunt et rēs pūblicās agunt.",
    "La lezione consolida le forme plurali della I e II declinazione. Si introduce il lessico dei ruoli sociali romani (servus/ancilla, dominus, cīvis). Si osserva la differenza tra spazi maschili e femminili nella società romana come contesto culturale.",
    [v("multī/multae","molti/molte"), v("frūmentum","grano, frumento"), v("colligunt","raccolgono"), v("ancilla","ancella, schiava"), v("culīna","cucina"), v("forum","foro, piazza pubblica"), v("conveniunt","si riuniscono"), v("rēs pūblica","cosa pubblica, stato"), v("cīvis","cittadino"), v("agunt","fanno, trattano")],
    "Lo studente declina correttamente I e II declinazione al plurale. Comprende il lessico dei ruoli sociali romani. Legge testi narrativi con più soggetti al plurale."
  ),
  L(
    "Magister puerōs vocat: 'Venīte et sedēte!' Puerī intrant et sedent. 'Recitāte versūs!' Mārcus surgit et versūs recitat. Magister eum laudat: 'Optimē, Mārce! Tu es discipulus dīligēns.' Mārcus erubēscit sed laetus est.",
    "La lezione introduce i comandi al plurale (imperativo plurale in -te) e il pronome personale tu. Si osserva il lessico della scuola romana (magister, discipulus, recitāre). La voce del maestro che dà ordini è il modello comunicativo principale.",
    [v("venīte","venite! (imper. pl.)"), v("sedēte","sedete! (imper. pl.)"), v("intrant","entrano"), v("recitāte","recitate! (imper. pl.)"), v("versus","verso, strofa (acc. pl.: versūs)"), v("surgit","si alza"), v("laudat","loda"), v("optimē","ottimamente, benissimo!"), v("dīligēns","diligente, attento"), v("erubēscit","arrossisce")],
    "Lo studente riconosce e usa l'imperativo plurale in -te. Comprende ordini dati in classe. Legge dialoghi tra insegnante e studenti in latino."
  ),
  L(
    "Rex in aulā sedet et iūs dīcit. Mīlitēs ante portās stant et rēgem custodiunt. Homo advenit et rēgī donum dat. Rex donum accipit et hominem interrogat: 'Quis es? Unde venīs?' Homo respondet: 'Cīvis Rōmānus sum.'",
    "La lezione introduce la III declinazione con nomi comuni (rex, homo, mīles). Si consolida l'uso dei casi (nominativo, accusativo, dativo) con i nuovi nomi. Compare il pronome interrogativo quis (chi?) e l'avverbio unde (da dove?).",
    [v("rex","re (III decl., nom.: rex, acc.: rēgem)"), v("homo","uomo, essere umano (III decl.)"), v("mīles","soldato (III decl.)"), v("aula","sala del trono, corte"), v("porta","porta, ingresso"), v("custodit","custodisce, sorveglia"), v("donum","dono"), v("accipit","accetta, riceve"), v("quis?","chi? (pron. interr.)"), v("unde?","da dove?")],
    "Lo studente legge e comprende nomi della III declinazione al nominativo e accusativo. Usa i pronomi interrogativi quis e unde. Comprende dialoghi con domanda e risposta in latino."
  ),
  L(
    "Rōma est urbs magna et antiqua. In Rōmā multa templa deis aedificāta sunt. Via Sacra per forum dūcit. Cīvēs Rōmānī per viam ambulant et merces emunt. Mercātor merces in tabernā vendit. Omnēs Rōmam amant.",
    "La lezione porta lo studente nel cuore di Roma: il Foro, la Via Sacra, le tabernae. Si introducono aggettivi della II classe (magnus/magna/magnum) in contesto descrittivo. Si osserva il lessico del commercio e della vita urbana romana.",
    [v("urbs","città (III decl.)"), v("antiquus/a","antico/a"), v("templum","tempio"), v("via","strada, via"), v("ambulant","camminano, passeggia"), v("merx / merces","merce, prodotto"), v("emunt","comprano"), v("mercātor","mercante"), v("taberna","bottega, negozio"), v("vendit","vende")],
    "Lo studente comprende descrizioni di luoghi urbani romani. Usa aggettivi in accordo con nomi di III declinazione. Legge testi sul commercio e la vita quotidiana a Roma."
  ),
  L(
    "Herī Mārcus in scholam iit. Magister dē bellīs Rōmānīs narrāvit. Mārcus bene audīvit et multa didicít. Post scholam ad villam rediit et patrī omnia narrāvit. Pater audīvit et dixit: 'Bene fēcistī, Mārce.'",
    "La lezione introduce il perfetto indicativo attivo come tempo del passato. Si osservano le desinenze del perfetto (iit, narrāvit, audīvit, rediit, dixit). Il racconto di un giorno scolastico fornisce il contesto narrativo per comprendere l'aspetto compiuto dell'azione.",
    [v("iit","andò, è andato (perf. di īre)"), v("narrāvit","raccontò (perf. di narrāre)"), v("audīvit","ascoltò, sentì (perf. di audīre)"), v("didicít","imparò (perf. di discere)"), v("rediit","tornò (perf. di redīre)"), v("dixit","disse (perf. di dīcere)"), v("fēcistī","hai fatto (perf. 2ª sing. di facere)"), v("herī","ieri"), v("post","dopo (+ acc.)"), v("bellum","guerra")],
    "Lo studente riconosce le forme del perfetto indicativo attivo. Comprende la differenza tra presente (azione in corso) e perfetto (azione compiuta). Legge narrazioni al passato in latino."
  ),
  L(
    "Iam Mārcus multa Latīnē scit. Legit, scrībit et intellegit. Lingua Latīna difficilis est sed pulchra quoque. Mārcus in scholā didicit verba et phrasēs multās. Nunc legere incipit librōs simplicēs. Mox poetas Rōmānōs legere poterit.",
    "Lezione di revisione e consolidamento di tutta l'unità A1.1. Si ripassano i casi principali (nom., acc., dat., abl.), il verbo esse, i verbi regolari al presente e al perfetto, e il lessico fondamentale del livello. Si introduce la nozione di infinito (legere, scrībere).",
    [v("iam","ormai, già"), v("scit","sa, conosce (scīre)"), v("scrībit","scrive"), v("intellegit","comprende"), v("lingua","lingua, linguaggio"), v("difficilis","difficile (III decl. agg.)"), v("pulcher/pulchra","bello/bella"), v("nunc","ora, adesso"), v("incipit","comincia (incipere)"), v("poterit","potrà (futuro di posse)")],
    "Lo studente consolida tutte le strutture grammaticali dell'A1.1. Ripasssa i cinque casi principali con esempi contestuali. Comprende un testo narrativo di livello A1 senza aiuto. È pronto per affrontare il livello A1.2."
  ),
  L(
    "Ecce quaestiōnēs dē cursū A1.1! Mārcus dīcit: 'Parātus sum.' Magister respondet: 'Optimē. Incipe!' Mārcus meminit omnium quae didicit: fōrmās, verba, phrasēs. Post tēstum Mārcus laetus exit. 'Bene, Mārce — nunc ad A1.2 vadis!'",
    "Test di fine livello A1.1. La lezione è dedicata alla verifica delle competenze acquisite nel corso: comprensione di testi brevi, riconoscimento dei casi, uso del vocabolario fondamentale e produzione di frasi semplici in latino.",
    [v("ecce","ecco! (esclamazione)"), v("quaestiō","domanda, questione"), v("parātus/a","pronto/a"), v("meminit","ricorda (verbo difettivo)"), v("fōrma","forma, desinenza"), v("post tēstum","dopo il test"), v("exit","esce"), v("nunc","ora"), v("vadis","vai (2ª sing. di vādere)")],
    "Lo studente dimostra la comprensione dei contenuti A1.1. Risponde a domande su testi brevi in latino. Usa correttamente le forme nominali e verbali apprese nel corso."
  ),
]

# ─────────────────────────────────────────────────────────────────────────────
# LATINO A1.2  — testi favolistici e narrativi semplici
# ─────────────────────────────────────────────────────────────────────────────
LAT_A12 = [
  L(
    "Leō in silvā habitābat. Leō rēx animālium erat. Ōlim leō aegrōtābat et in spēluncā iacēbat. Multae bēstiae ad eum vīsitandum veniēbant — praeter vulpem. Leō vulpem interrogāvit: 'Cūr nōn venīs?' Vulpēs respondit: 'Vestigia tua intrō dūcunt, foras nōn exeunt.'",
    "La prima lezione del livello A1.2 usa una favola esopica adattata (il leone e la volpe) come testo narrativo principale. Si consolida l'imperfetto indicativo come tempo della narrazione continua. Il testo introduce il lessico degli animali e della foresta.",
    [v("leō","leone (III decl.)"), v("silva","foresta, bosco"), v("rēx animālium","re degli animali"), v("aegrōtābat","era malato (imperf.)"), v("spēlunca","caverna, grotta"), v("iacēbat","giaceva, stava disteso"), v("bēstia","bestia, animale"), v("vulpēs","volpe (III decl.)"), v("vestigium","traccia, impronta"), v("foras","fuori (moto da luogo)")],
    "Lo studente legge una favola latina adattata. Usa l'imperfetto come tempo della narrazione. Comprende il lessico degli animali. Inferisce il significato dalla struttura narrativa del racconto."
  ),
  L(
    "Puer in montibus gregem pāscēbat. Ōlim clāmāvit: 'Lupus adest! Adiuvāte mē!' Agricolae cucurrērunt, sed lupum nōn vīdērunt. Puer rīsit. Iterum idem fēcit. Deinde lupus vērē vēnit — sed nēmō puerō crēdidit.",
    "La favola del pastore bugiardo (De puero mendace, da Fedro) introduce la consecutio temporum in una narrazione breve. Si lavora sull'alternanza imperfetto/perfetto: l'imperfetto per le azioni di sfondo, il perfetto per gli eventi puntuali.",
    [v("grex","gregge (III decl., gen.: gregis)"), v("pāscēbat","pasceva (imperf. di pāscere)"), v("clāmāvit","gridò (perf. di clāmāre)"), v("lupus","lupo"), v("adest","è qui, è presente"), v("cucurrērunt","corsero (perf. di currere)"), v("rīsit","rise (perf. di rīdere)"), v("iterum","di nuovo, ancora"), v("vērē","veramente"), v("nēmō","nessuno")],
    "Lo studente comprende la differenza narrativa tra imperfetto e perfetto. Legge una favola morale e ne coglie il messaggio. Usa nēmō e altri pronomi indefiniti di base."
  ),
  L(
    "Mīlitēs Rōmānī per Galliam iter faciēbant. Dux legiōnem hortābātur: 'Mīlitēs, fortēs estōte! Rōma nōs spectat.' In castrīs disciplīna sevēra erat. Mīlitēs multum labōrābant: fossās fodiēbant, vallum aedificābant, vigilābant.",
    "La lezione introduce il lessico militare romano attraverso una narrazione sull'esercito in marcia. Si approfondisce l'uso dell'imperfetto descrittivo. Si osservano le strutture del campo romano (castra, vallum, fossa) come contesto culturale.",
    [v("mīles","soldato (III decl.)"), v("iter facere","fare un cammino, marciare"), v("dux","comandante, capo"), v("legiō","legione"), v("hortābātur","esortava, incoraggiava"), v("castra","accampamento (pl. tant.)"), v("disciplīna","disciplina, ordine"), v("fossa","fossato"), v("fodiēbant","scavano (imperf.)"), v("vallum","palizzata, vallo difensivo")],
    "Lo studente comprende il lessico militare romano di base. Usa l'imperfetto descrittivo in testi narrativi. Conosce la struttura dell'accampamento romano come elemento culturale."
  ),
  L(
    "Snupius canis est — nōn canis Rōmānus, sed canis novī temporis. In casulā albā habitat et de vītā cōgitat. 'Erat nox tempestāte obscūra' scrībit Snupius. Canis ille philosophus est et poēta. Sed Carolus Magnus eum nōn intellegit.",
    "Una lezione giocosa su Snoopy in latino: un testo neo-latino umoristico che usa strutture A1.2 in contesto insolito. Si lavora sulla perifrasi temporale (novī temporis), sull'imperfetto narrativo e sulla figura del cane-filosofo come rovesciamento comico.",
    [v("canis","cane (III decl.)"), v("casula","piccola casa, cuccia"), v("albus/a","bianco/a"), v("de + abl.","riguardo a, su (argomento)"), v("cōgitat","pensa, riflette"), v("nox","notte (III decl.)"), v("tempestās","tempesta, maltempo"), v("obscūrus/a","oscuro/a, buio"), v("philosophus","filosofo"), v("intellegit","capisce, comprende")],
    "Lo studente legge un testo neo-latino umoristico. Riconosce strutture A1.2 in contesto narrativo insolito. Comprende la perifrasi nominale e aggettivale. Dimostra flessibilità nell'interpretazione del testo."
  ),
  L(
    "Orpheus citharā suāvissimē canēbat. Bēstiae, arbōrēs, saxaque eum sequēbantur. Orpheus Eurydīcen amābat. Eurydīce mortua est — serpēns eam momorderat. Orpheus ad Inferōs dēscendit ut uxōrem reciperet.",
    "Il mito di Orfeo come testo narrativo A1.2 introduce il congiuntivo finale con ut (scopo). La storia permette di lavorare su costrutti sintattici più complessi mantenendo un contesto narrativo coinvolgente. Si introduce il concetto di ablativo assoluto in forma semplice.",
    [v("cithara","cetra, lira"), v("canēbat","suonava, cantava (imperf.)"), v("suāvis","dolce, melodioso"), v("sequēbantur","seguivano (imperf. depon.)"), v("saxum","roccia, pietra"), v("mortuus/a","morto/a"), v("serpēns","serpente (III decl.)"), v("momorderat","aveva morso (piuccheperfetto)"), v("Inferi","gli Inferi, il mondo dei morti"), v("ut + congiuntivo","affinché, per (scopo)")],
    "Lo studente comprende un racconto mitologico in latino. Riconosce la proposizione finale con ut + congiuntivo. Usa il lessico del mito classico. Legge frasi con il piuccheperfetto indicativo."
  ),
  L(
    "Colosseum maximum amphitheātrum Rōmae erat. Vespasianus imperātor id aedificāvit. Octōgintā mīlia spectātōrum capere poterat. Gladiātōrēs ibī pugnābant et bēstiae occīdēbantur. Nunc Colosseum stat — aetātis Rōmānae monumentum.",
    "Il Colosseo come testo descrittivo-storico introduce il passivo (occīdēbantur) e i numerali cardinali grandi. Si lavora su un testo misto (descrizione nel presente, racconto nel perfetto). Il contesto culturale è lo spettacolo pubblico romano.",
    [v("amphitheātrum","anfiteatro"), v("Vespasianus","Vespasiano (imperatore 69-79 d.C.)"), v("aedificāvit","costruì (perf.)"), v("octōgintā","ottanta"), v("spectātor","spettatore"), v("capit/capere poterat","poteva contenere"), v("gladiātor","gladiatore"), v("pugnābant","combattevano"), v("occīdēbantur","venivano uccisi (imperf. pass.)"), v("monumentum","monumento, testimonianza")],
    "Lo studente comprende un testo storico-descrittivo sul Colosseo. Riconosce le forme del passivo all'imperfetto. Usa i numerali cardinali grandi. Conosce il contesto dello spettacolo gladiatorio romano."
  ),
  L(
    "Aenigma: 'Domum habeō sed sine mūrīs et sine tēctō. Domum meam semper ferō. Intra domum meam habitō. Quid sum?' Respondē: Cochlea sum! Cochlea animal est quod domum suam semper secum portat.",
    "Un indovinello in latino (aenigma) sulla chiocciola introduce i pronomi relativi (quod, quam) in contesto giocoso. Si lavora sulla struttura della domanda retorica e sull'uso dei pronomi possessivi (meus, suus). Il testo breve e ritmico facilita la memorizzazione.",
    [v("aenigma","indovinello (greco in latino)"), v("domus","casa (IV decl., gen.: domūs)"), v("mūrus","muro"), v("tēctum","tetto"), v("ferō","porto (verbo irr.)"), v("intra + acc.","dentro"), v("cochlea","chiocciola, lumaca"), v("quod","che, il quale (rel. neut.)"), v("secum","con sé"), v("portat","porta, trasporta")],
    "Lo studente comprende e interpreta un indovinello latino. Usa il pronome relativo quod in contesto. Conosce la IV declinazione (domus). Riconosce la struttura della proposizione relativa."
  ),
  L(
    "Puer māne surgit. Sē lavat et vestimenta induit. Mātrem salutat: 'Bonum diem, māter!' Ientāculum edit: panem et caseum. Deinde ad scholam it. Vesperī redit, cēnat cum familiā et librum legit ante somnium.",
    "Una giornata tipica di un ragazzo romano introduce il lessico della vita quotidiana (pasti, abiti, routine). Si lavora sugli avverbi temporali (māne, vesperī) e sui verbi riflessivi con accusativo riflessivo (sē lavat). Importante contesto culturale: l'alimentazione romana.",
    [v("māne","di mattina, all'alba"), v("surgit","si alza (surgere)"), v("sē lavat","si lava (riflessivo)"), v("vestimenta","vestiti, abiti (pl.)"), v("induit","indossa (induere)"), v("ientāculum","colazione"), v("panis","pane (III decl.)"), v("caseus","formaggio"), v("vesperī","di sera"), v("somnium","sogno, sonno")],
    "Lo studente comprende un testo sulla routine quotidiana romana. Usa gli avverbi temporali māne e vesperī. Riconosce i verbi riflessivi con sē. Conosce il lessico dell'alimentazione e dell'abbigliamento romano."
  ),
  L(
    "Puer mātrem quaerit. 'Māter, ubi es?' Māter in culīnā est. 'Quid facis, māter?' 'Cēnam parō.' Puer in culīnam intrat. 'Adiuvāre tē possum?' Māter rīdet: 'Ita vērō! Cape aquam ē fonte.' Puer laetus aquam fert.",
    "Un dialogo quotidiano tra figlio e madre lavora sulla struttura della domanda-risposta. Si consolidano i verbi irregolari frequenti (esse, posse, ferre, capere). Si introduce la proposizione infinitiva con possum (possum adiuvāre = posso aiutare).",
    [v("quaerit","cerca, chiede"), v("ubi?","dove?"), v("quid facis?","cosa fai?"), v("culīna","cucina"), v("cēna","cena, pasto principale"), v("adiuvāre","aiutare (inf. pres.)"), v("possum","posso (posse + inf.)"), v("ita vērō","sì, certamente"), v("cape!","prendi! (imper. di capere)"), v("fert","porta (ferre, irr.)")],
    "Lo studente legge e comprende un dialogo familiare. Usa i verbi irregolari esse, posse, ferre in contesto. Riconosce la costruzione possum + infinito. Comprende le strutture della domanda in latino."
  ),
  L(
    "Herī in forō magnō cōnvēnimus. Multi cīvēs aderant. Ōrātor in rostrīs stābat et dē lēgibus novīs dīcēbat. Aliquī laudābant, aliquī vituperābant. Tandem senex sapiēns surrexit: 'Audiāmus omnia antequam iūdicāmus.'",
    "La vita pubblica romana: il foro, i rostri, il discorso politico. Si introduce la I persona plurale (cōnvēnimus, audiāmus) e i pronomi indefiniti (aliquī = alcuni). Il congiuntivo esortativo (audiāmus) e la congiunzione antequam preparano strutture A2.",
    [v("cōnvēnimus","ci riunimmo (perf. 1ª pl.)"), v("rostrum","rostro, tribuna degli oratori (pl.: rostra)"), v("ōrātor","oratore"), v("lēx/lēgis","legge (III decl.)"), v("aliquī","alcuni (pron. indef.)"), v("vituperat","biasima, critica"), v("tandem","finalmente, alla fine"), v("senex","vecchio, anziano (III decl.)"), v("sapiēns","saggio, sapiente"), v("antequam","prima che, prima di")],
    "Lo studente comprende un testo sulla vita pubblica romana. Usa la I persona plurale di verbi regolari e irregolari. Riconosce il congiuntivo esortativo (audiāmus). Comprende le congiunzioni temporali antequam."
  ),
  L(
    "Via Appia via antiquissima Rōmānōrum est. A Rōmā ad Brundisium dūcit — per ducentōs et septuāgintā mīlia passuum. Appius Claudius cēnsor eam construxit annō trecentēsimō duodēvīcēsimō ante Christum. Nunc viatōrēs eam adhūc ambulant.",
    "La Via Appia come testo storico-geografico introduce i numerali ordinali e le distanze romane (mīlle passuum). Si lavora sulla struttura della frase relativa complessa e sul passivo (construxit → viene costruita). Contesto: le grandi opere pubbliche romane.",
    [v("via","strada, via"), v("antiquissimus/a","antichissimo/a (superlativo)"), v("dūcit","conduce, porta"), v("mīlle passuum","un miglio (mille passi = 1480 m)"), v("cēnsor","censore (magistratura romana)"), v("construxit","costruì (perf. di construere)"), v("annus","anno"), v("ante Christum","avanti Cristo"), v("viatōr","viaggiatore"), v("adhūc","ancora, tuttora")],
    "Lo studente comprende un testo storico sulle grandi opere romane. Usa i numerali cardinali e ordinali. Comprende le misure di distanza romane. Legge frasi passive al perfetto."
  ),
  L(
    "Recapitulātiō! Mārcus amīcō suō Quīntō scrībit: 'Mī Quīnte, multum didicī hōc annō! Fābulās Latīnās lēgī, de mīlitibus et leōnibus et viīs narrāvī. Nunc paene omnia intellegō. Mox libenter poētās legam.' Quīntus respondet: 'Et ego! Pergāmus!'",
    "Revisione complessiva del livello A1.2 attraverso una lettera in latino. Si ripassano le strutture narrative (imperfetto, perfetto), i pronomi personali e possessivi, e il lessico dei temi trattati. La lettera è un genere letterario autentico che prepara agli stili A2.",
    [v("recapitulātiō","riepilogo, revisione"), v("amīcus","amico"), v("suus/a/um","suo/sua/suo (poss. riflessivo)"), v("mī Quīnte","caro Quinto (voc.)"), v("hōc annō","quest'anno"), v("paene","quasi"), v("libenter","volentieri"), v("poēta","poeta (I decl. masch.)"), v("legam","leggerò (futuro)"), v("pergāmus!","continuiamo! (cong. esortat.)")],
    "Lo studente sintetizza le competenze del livello A1.2. Scrive e comprende una breve lettera in latino. Riconosce strutture narrative, epistolari e dialogiche. È pronto per affrontare il livello A2."
  ),
]

# ─────────────────────────────────────────────────────────────────────────────
# LATINO A2.1  — participi, gerundio, congiuntivo
# ─────────────────────────────────────────────────────────────────────────────
LAT_A21 = [
  L(
    "Caesar in Galliā pugnābat. Gallī, fortēs et bellicōsī, Rōmānīs fortiter resistēbant. Caesar, copias suās cōnspicāns, mīlitēs hortātus est: 'Vincendum est!' Legiōnēs impetum fēcērunt et hostem fūgērunt.",
    "Il livello A2.1 si apre con un testo ispirato a Cesare. Si introduce il participio presente (cōnspicāns) e il participio perfetto (hortātus). Si lavora sulla costruzione dell'ablativo assoluto come struttura sintattica chiave del latino.",
    [v("Gallia","Gallia (regione transalpina)"), v("bellicōsus/a","bellicoso, guerriero"), v("cōnspicāns","guardando, osservando (part. pres.)"), v("hortātus est","esortò (part. perf. pass. + esse)"), v("vincendum est","bisogna vincere (gerundivo obbligatorio)"), v("legiō","legione"), v("impetum facere","attaccare, sferrare un attacco"), v("hostis","nemico"), v("fūgērunt","fuggirono (perf. di fugere)")],
    "Lo studente riconosce il participio presente e perfetto in contesto. Comprende la funzione dell'ablativo assoluto. Usa il gerundivo impersonale (vincendum est). Legge testi storici in stile cesariano."
  ),
  L(
    "Cicerone in senātū dīxit: 'Patres cōnscrīptī, hostem in forō habemus! Catilīna, coniūrātiōne factā, urbem dēlēre cōnātur. Vōbīs cōnsultandum est. Ego vōs moneō: cavēte!'",
    "Un brano ispirato alle Catilinarie di Cicerone introduce il lessico del discorso politico e la costruzione impersonale con gerundivo (cōnsultandum est = bisogna deliberare). Si lavora sull'ablativo assoluto participiale (coniūrātiōne factā).",
    [v("senātus","senato"), v("patres cōnscrīptī","senatori (formula ufficiale)"), v("coniūrātiō","congiura"), v("cōnātur","tenta, si sforza (dep.)"), v("dēlēre","distruggere"), v("cōnsultandum est","bisogna deliberare (gerundivo)"), v("moneo","avverto, metto in guardia"), v("cavēte!","state attenti! fate attenzione!"), v("factā (abl. ass.)","essendo stata fatta"), v("vōbīs","a voi (dat. pl. di vōs)")],
    "Lo studente comprende un brano di oratoria politica latina. Usa il gerundivo impersonale per esprimere necessità. Riconosce l'ablativo assoluto con participio perfetto passivo. Comprende il lessico politico romano."
  ),
  L(
    "Philosophi antiqui de anima et corpore saepe disputābant. Plātō scrīpsit animam immortālem esse; Epicurus autem docēbat corpus et animam simul perīre. Stoici dīcēbant sapientem virtūte sōlā beātum esse.",
    "Un testo di filosofia antica introduce l'accusativo con infinito (AcI) come struttura della proposizione dichiarativa. I verba dicendi e sentiendi (scrīpsit, docēbat, dīcēbant) reggono l'infinitiva. Il contesto delle scuole filosofiche greche e romane è culturalmente ricco.",
    [v("philosophus","filosofo"), v("anima","anima, spirito"), v("corpus","corpo (III decl. neutro)"), v("disputāre","discutere, argomentare"), v("immortālis","immortale"), v("docēbat","insegnava (imperf.)"), v("simul","insieme, allo stesso tempo"), v("perīre","morire, perire (inf. di perīre)"), v("stoicus","stoico"), v("beātus/a","beato, felice"), v("sōlus/a","solo/a, unicamente")],
    "Lo studente riconosce e costruisce la proposizione infinitiva (AcI) con verba dicendi. Comprende il significato delle principali scuole filosofiche antiche. Legge un testo di filosofia adattato senza perdere il senso."
  ),
  L(
    "Rōmulus et Remus frātrēs erant. Māter eōrum Rhea Silvia erat, virgō Vestālis. Pater deōrum Mārs erat. Rēx Amulius puerōs in flūmen iussit iacī — sed lupam invēnērunt quae eōs aluisset.",
    "Il mito di Romolo e Remo permette di lavorare sulla proposizione infinitiva passiva (iussit iacī) e sul congiuntivo del passato in proposizione relativa (quae... aluisset). Si introduce il supino passivo con iubeo. Contesto: le origini leggendarie di Roma.",
    [v("frāter","fratello (III decl.)"), v("virgō Vestālis","vergine Vestale"), v("Mārs","Marte (dio della guerra)"), v("iussit","ordinò (perf. di iubēre)"), v("iacī","essere gettati (inf. pass. di iacere)"), v("lupa","lupa"), v("aluisset","aveva allattato (piucch. cong.)"), v("quae...aluisset","che li aveva allattati (rel. cum congiuntivo)"), v("invēnērunt","trovarono")],
    "Lo studente comprende la proposizione infinitiva passiva con iubeo. Riconosce il congiuntivo in proposizione relativa. Legge il racconto mitologico della fondazione di Roma con strutture A2."
  ),
  L(
    "Virgilius scrīpsit: 'Arma virumque canō, Troiae qui primus ab ōrīs Italiam fātō profugus lāvīniaque vēnit lītora.' Aenēās Troiānus erat. Post bellum Troianum in Italiam nāvigāvit ut novam patriam conderet.",
    "La prima riga dell'Eneide in originale introduce la lettura di autentico testo poetico a livello A2. Si lavora sull'ordine delle parole in poesia, sull'iperbato e sull'uso di fātō (ablativo di causa). La proposizione finale con ut + congiuntivo è il punto grammaticale principale.",
    [v("arma virumque","le armi e l'uomo (acc. pl.)"), v("canō","canto (verbo poetico)"), v("fātum","destino, fato"), v("profugus","fuggiasco, profugo"), v("lītus/litoris","riva, litorale (III decl. neutro)"), v("Troiānus/a","troiano/a"), v("nāvigāvit","navigò (perf.)"), v("ut conderet","per fondare (finale + cong. imperf.)"), v("hyperbaton","figura retorica: parole separate che si accordano")],
    "Lo studente legge e comprende un verso autentico dell'Eneide. Riconosce la proposizione finale con ut + congiuntivo imperfetto. Comprende l'ordine delle parole nella poesia latina. Conosce il mito di Enea come fondatore di Roma."
  ),
  L(
    "Ovīdius nārrāt: Pygmaliōn statuam pulcherrimam ēlaborāvit. Statuam tam amābat ut eam vīvam esse optāret. Venus precēs audīvit. Statua in fēminam vēram mūtāta est. Pygmaliōn gavisus est nūptiāsque cēlēbrāvit.",
    "Il mito di Pigmalione da Ovidio (Met. X) introduce la proposizione consecutiva con tam... ut + congiuntivo e il passivo impersonale (mūtāta est). Si lavora sull'accordo del participio nel passivo. Testo letterario adattato dall'originale ovidiano.",
    [v("ēlaborāvit","lavorò a lungo, scolpì (perf.)"), v("tam... ut","tanto... che (consecutiva)"), v("optāret","desiderasse (cong. imperf. di optāre)"), v("precēs","preghiere (III decl., pl. tant.)"), v("mūtāta est","fu trasformata (pass. perf. femm.)"), v("gavisus est","si rallegrò (semidepon. gaudēre)"), v("nūptiae","nozze (pl. tant.)"), v("cēlēbrāvit","celebrò"), v("statua","statua"), v("tam","così, tanto")],
    "Lo studente comprende la proposizione consecutiva (tam... ut + cong.). Usa correttamente il passivo del perfetto con accordo del participio. Legge un testo ovidiano adattato. Conosce il mito di Pigmalione."
  ),
  L(
    "In Rōmā vetere iūdicium populī rēgēbat. Accūsātor reum ante iūdicēs dūcēbat. Reus sē dēfendēbat aut advocātum habēbat. Iūdicēs, omnibus audītīs, dē culpā rēī statuēbant. Condemnātus punīrī poterat aut exsiliō aut morte.",
    "Il sistema giudiziario romano come contesto per lavorare sulla costruzione dell'ablativo assoluto (omnibus audītīs) e sulla diatesi passiva in strutture più complesse. Si introduce il lessico giuridico romano (reus, accūsātor, iūdex, advocātus).",
    [v("iūdicium","giudizio, processo"), v("accūsātor","accusatore"), v("reus","imputato, accusato"), v("iūdex","giudice (III decl.)"), v("advocātus","avvocato difensore"), v("omnibus audītīs","dopo aver ascoltato tutti (abl. ass.)"), v("culpa","colpa"), v("statuēbant","decidevano (imperf.)"), v("condemnātus","condannato (part. perf. pass.)"), v("exsilium","esilio")],
    "Lo studente comprende il sistema giudiziario romano. Usa l'ablativo assoluto con participio perfetto passivo. Riconosce il lessico giuridico latino. Legge un testo espositivo con strutture passive complesse."
  ),
  L(
    "Horātius scrīpsit: 'Dum loquimur, fūgerit invida aetās: carpe diem, quam minimum crēdula posterō.' Tempus, inquit poēta, celeriter fluit. Itaque laetitiā fruendum est et amīcīs dandum tempus.",
    "L'Ode I,11 di Orazio introduce la lettura di poesia lirica autentica a livello A2. Il focus grammaticale è sul gerundivo con dativo di possesso (fruendum est nobis, dandum est) come espressione di necessità/obbligo. Il carpe diem è uno dei temi più discussi della cultura romana.",
    [v("dum loquimur","mentre parliamo (dum + pres. ind.)"), v("fūgerit","sarà fuggito (futuro anteriore)"), v("invida","invidiosa, ostile"), v("aetās","età, tempo della vita (III decl.)"), v("carpe diem","cogli il giorno (imper. di carpere)"), v("quam minimum","il meno possibile"), v("posterus","il giorno seguente, il futuro"), v("laetitia","gioia, letizia"), v("fruendum est","bisogna godere (gerundivo)"), v("fluit","scorre, fluisce")],
    "Lo studente legge versi autentici di Orazio. Comprende il gerundivo con dativo come struttura di necessità. Coglie il significato culturale del carpe diem. Analizza la struttura di un testo poetico lirico."
  ),
  L(
    "Plinius Secundus in epistulā scrībit: 'Videram modo eruptionem Vesuvii. Nubes ingēns, similima pinō, surgebat. Avunculus meus, vir fortis, ad litus nāvigāvit ut auxilium ferret. Ibi periit — sed glōriōsē.'",
    "Una lettera di Plinio il Giovane sull'eruzione del Vesuvio (79 d.C.) come testo autentico adattato. Si lavora sul piuccheperfetto indicativo (videram, surgebat) e sulla proposizione finale (ut... ferret). Il contesto storico dell'eruzione è culturalmente fondamentale.",
    [v("epistula","lettera"), v("eruptio","eruzione"), v("nubes","nube, nuvola (III decl.)"), v("ingēns","enorme, gigantesco"), v("similis + dat.","simile a"), v("pinus","pino (albero)"), v("surgēbat","si alzava (imperf.)"), v("avunculus","zio materno"), v("litus/litoris","riva, spiaggia"), v("periit","morì (perf. di perīre)")],
    "Lo studente legge una lettera latina autentica adattata (Plinio). Usa il piuccheperfetto indicativo per azioni anteriori. Comprende la proposizione finale con ut + congiuntivo imperfetto. Conosce il contesto storico dell'eruzione del Vesuvio."
  ),
  L(
    "Titus Flāvius Vespāsiānus, dictus Titus, fīlius Vespāsiānī imperātōris erat. Rēgnāvit breviōre tempore — duōbus annis. Mons Vesuvius sub eō ērupit et Pompēios dēlēvit. Titus ipse cīvibus auxiliātus est. 'Dēliciae generis hūmānī' ā Suetōniō vocātus est.",
    "Biografia di Tito imperatore come testo storico A2 con strutture partecipiali (dictus, vocātus est) e ablativo di tempo (breviōre tempore, duōbus annis). Si lavora sull'ablativo comparativo e sulla datazione romana.",
    [v("dictus","chiamato, detto (part. perf. pass. di dīcere)"), v("imperātor","imperatore"), v("rēgnāvit","regnò (perf.)"), v("brevior/ius","più breve (comparativo)"), v("tempus","tempo (III decl. neutro)"), v("sub eō","durante il suo regno (lett. sotto di lui)"), v("ērupit","eruttò (perf. di ērumpere)"), v("auxiliātus est","aiutò (semidep.)"), v("dēliciae","delizia, gioia"), v("genus hūmānum","genere umano")],
    "Lo studente legge un testo biografico storico su un imperatore romano. Comprende il participio perfetto passivo usato come aggettivo. Usa l'ablativo di tempo e il comparativo. Conosce i fatti principali del principato flavio."
  ),
  L(
    "Quī est sapiens? Stoici respondent: 'Is qui virtūtem sequitur et passionibus nōn servit. Sapiens nec gaudiō nec dolore vincitur. Fortūna, bona mala que, eum nōn movet.' Difficilis via, sed pulcherrima.",
    "Una riflessione filosofica stoica permette di lavorare sul pronome relativo is... qui (colui che) e sul congiuntivo nella proposizione relativa impropria. Si introducono i contrari (gaudium/dolor, bonus/malus) e la struttura nec... nec.",
    [v("sapiens","saggio (III decl. agg. sostantivato)"), v("virtūs/virtūtis","virtù (III decl. femm.)"), v("sequitur","segue (dep. III)"), v("passio","passione, emozione"), v("servīre + dat.","servire, essere schiavo di"), v("nec... nec","né... né"), v("gaudium","gioia, piacere"), v("dolor/dolōris","dolore, sofferenza"), v("vincit","vince, supera"), v("fortūna","fortuna, sorte")],
    "Lo studente comprende un testo di filosofia stoica adattato. Usa il pronome relativo is qui (colui che). Riconosce la struttura nec... nec. Comprende i principi base della filosofia stoica romana."
  ),
  L(
    "Graecī Troiam obsidēbant. Decem annōs pugnābant nec vincere poterant. Tandem Ulixēs cōnsilium cēpit: equum ligneum fēcērunt in quo mīlitēs sē abdidērunt. Troiānī equum in urbem traxērunt. Noctu mīlitēs exiērunt — Troia cecidit.",
    "Il cavallo di Troia come testo narrativo A2 di revisione. Si consolida l'uso di nec + imperf. per azione continua fallita, del congiuntivo in proposizione relativa (in quo abdidērunt), e del perfetto narrativo. Preparazione all'A2.2.",
    [v("obsidēre","assediare (obsidēbant: imperf.)"), v("decem","dieci"), v("vincere","vincere"), v("poterant","potevano (imperf. di posse)"), v("tandem","finalmente"), v("cōnsilium capere","prendere una decisione"), v("ligneus/a","di legno"), v("abdidērunt","si nascosero (perf. di abdere)"), v("noctū","di notte (avv.)"), v("cecidit","cadde (perf. di cadere)")],
    "Lo studente comprende un testo narrativo più esteso sul mito troiano. Consolida l'uso di imperfetto e perfetto. Usa il congiuntivo in proposizione relativa. Riconosce il lessico del racconto epico."
  ),
  L(
    "Vale, mī amīce! Hōc cursū multum didicistī. Nōvistī iam participia, gerundium, coniūnctīvum, AcI. Verba Latīna nōn sōlum grammatica sunt — sunt vox antiquōrum. Perge et mox legēs auctōrēs ipsōs.",
    "Lezione conclusiva e di revisione del livello A2.1. Riepilogo di tutte le strutture grammaticali studiate: participio, gerundio, gerundivo, congiuntivo nelle proposizioni principali e subordinate, AcI. Motivazione per il proseguimento degli studi.",
    [v("vale!","addio, stai bene! (imper. di valēre)"), v("nōvistī","hai conosciuto, sai già (perf. di nōscere)"), v("participium","participio"), v("gerundium","gerundio"), v("coniūnctīvus","congiuntivo"), v("vōx","voce (III decl. femm.)"), v("antiquī","gli antichi (pl. sostantivato)"), v("perge!","continua! vai avanti!"), v("mox","presto, tra poco"), v("auctor/auctoris","autore, scrittore")],
    "Lo studente consolida tutte le strutture del livello A2.1. Comprende un testo in stile epistolare che fa il punto sulle competenze acquisite. È motivato a proseguire verso A2.2 e la lettura di autori classici."
  ),
]

# ─────────────────────────────────────────────────────────────────────────────
# LATINO A2.2  — testi autentici adattati, sintassi complessa
# ─────────────────────────────────────────────────────────────────────────────
LAT_A22 = [
  L(
    "Caesar bellum Gallicum VII annis gessit. Helvētiī, gente bellicōsissimā, prīmī erant quī Rōmānīs resistērent. Caesar, exercitū comparātō, in Galliam contendit. Prīmō proeliō, Helvētiī victī, in patriam revertī coāctī sunt.",
    "Apertura dell'A2.2 con Cesare autentico adattato (BG I). Si lavora sulla proposizione relativa con congiuntivo (quī... resistērent = tali da resistere) e sull'ablativo assoluto al participio perfetto (exercitū comparātō). Progressione verso la lettura diretta di autori classici.",
    [v("gerēre bellum","fare guerra (gestit: perf. di gerere)"), v("gēns/gentis","stirpe, popolo (III decl.)"), v("bellicōsissimus/a","guerriero al superlativo"), v("resistērent","resistessero (cong. imperf. relativa)"), v("exercitus comparātus","esercito radunato (abl. ass.)"), v("contendit","marciò, si diresse (perf.)"), v("proelium","battaglia, scontro"), v("victī (abl. ass.)","sconfitti"), v("revertī","tornare, fare ritorno"), v("coāctī sunt","furono costretti (pass.)")],
    "Lo studente legge un testo autentico di Cesare adattato. Comprende la proposizione relativa con congiuntivo (relativa impropria). Usa l'ablativo assoluto in testi storici. Conosce il contesto della Guerra Gallica."
  ),
  L(
    "Eutropius nārrat: 'Octāviānus, post Actiacam pugnam, solus imperābat. Aedificāvit Rōmam — ut ipse glōriābātur — ex later coctili acceptam marmoreāmque relīquit. Pāx Augustāna per ducentos fere annos Rōmam tenuit.'",
    "Un brano da Eutropio (Breviarium VII) come testo storico autentico adattato. Si lavora sull'ut cum congiuntivo in proposizione comparativa (ut ipse glōriābātur = come lui stesso si vantava) e sulle metafore architettoniche di Augusto. Contesto: il principato augusteo.",
    [v("Actiacus/a","di Azio (battaglia 31 a.C.)"), v("solus imperābat","regnava da solo"), v("ipse","egli stesso (pron. riflessivo intensivo)"), v("glōriābātur","si vantava (dep. imperf.)"), v("later coctilis","mattone cotto"), v("marmoreus/a","di marmo"), v("relīquit","lasciò, trasmise (perf.)"), v("pāx","pace (III decl. femm.)"), v("fere","circa, quasi"), v("tenuit","mantenne, tenne (perf. di tenēre)")],
    "Lo studente legge un testo storico da Eutropio. Comprende ut + indicativo come comparativa. Conosce il principato di Augusto e la Pax Romana. Usa il lessico della storiografia latina."
  ),
  L(
    "Livius scrībit: 'Hōrātius Coclēs, ponte cōnsumptō, in flūmen dēsiluisse fertur. Armātus in Tiberim ingressus ad suōs trāvit, rem ausus super omnem fīdem memorandam.' Hōrātius patriae suae amōre impulsus est.",
    "Un episodio da Livio (Ab Urbe Condita II) sul ponte Sublicio e Orazio Coclite. Si lavora sulla costruzione passiva impersonale (fertur + infinito = si racconta che) e sul participio congiunto (armātus, impulsus). Testo di storia leggendaria romana.",
    [v("pons/pontis","ponte (III decl.)"), v("cōnsumptō (abl. ass.)","distrutto il ponte"), v("dēsiluisse fertur","si racconta che saltò giù (fertur + inf.)"), v("armātus","armato (part. perf. pass.)"), v("Tiberis","il Tevere (fiume)"), v("trāvit","attraversò a nuoto (perf. di trānāre)"), v("ausus","avendo osato (part. perf. dep. di audēre)"), v("fīdem","credibilità, fede (acc. sing.)"), v("memorandus/a","degno di memoria (gerundivo)")],
    "Lo studente legge un testo autentico da Livio adattato. Comprende la costruzione fertur + infinito (passivo impersonale). Usa il participio congiunto. Conosce le leggende delle origini di Roma."
  ),
  L(
    "Catullus amīcō scrīpsit: 'Vivāmus, mea Lesbia, atque amēmus, rūmōrēsque senum sevēriōrum omnēs ūnius aestimēmus assis.' Amor Catullī ardēns erat sed fragilis. Mox Lesbia eum dēseruit et Catullus dolōre oppressus est.",
    "Il carme V di Catullo autentico come esempio di poesia neoterica. Si lavora sul congiuntivo esortativo (vivāmus, amēmus) e sulla struttura della metafora commerciale (ūnius assis = un centesimo). Introduzione alla poesia soggettiva romana.",
    [v("vivāmus!","viviamo! (cong. esortat. I pl.)"), v("atque","e anche, e inoltre"), v("amēmus!","amiamo! (cong. esortat.)"), v("rūmor","chiacchiera, voce di popolo"), v("senex sevērior","vecchio più severo (comp.)"), v("aestimāre","valutare, stimare"), v("as/assis","asse (moneta di poco valore)"), v("ardēns","ardente, appassionato"), v("fragilis","fragile, precario"), v("dēseruit","abbandonò (perf. di dēserere)")],
    "Lo studente legge versi autentici di Catullo. Usa il congiuntivo esortativo di I persona. Comprende la struttura della metafora ironica. Conosce il movimento dei poeti neoterici e il contesto biografico di Catullo."
  ),
  L(
    "Livius: 'Saguntinī, sociī populī Rōmānī, ab Hannibale obsidēbantur. Rōmam lēgātōs mīsērunt quī auxilium peterent. Senātus Carthaginem lēgātōs misit quī hoc vetārent. Hannibal Saguntum vī cēpit — et bellum Pūnicum secundum ortum est.'",
    "La caduta di Sagunto (219 a.C.) da Livio come inizio del Secondo Conflitto Punico. Si lavora sulle proposizioni relative finali (quī... peterent = per chiedere). Struttura narrativa complessa con doppia azione diplomatica. Lessico militare e diplomatico.",
    [v("Saguntinī","gli abitanti di Sagunto (città spagnola)"), v("sociī","alleati (del popolo romano)"), v("lēgātus","ambasciatore, legato"), v("quī peterent","per chiedere (rel. finale + cong.)"), v("Carthago/inis","Cartagine"), v("vetārent","vietassero (cong. imperf.)"), v("vī","con la forza (abl. di modus)"), v("cēpit","prese, conquistò (perf. di capere)"), v("bellum Pūnicum","guerra punica"), v("ortum est","nacque, ebbe inizio (orior, dep.)")],
    "Lo studente comprende la proposizione relativa finale con congiuntivo imperfetto. Legge testi storiografici da Livio adattati. Conosce il contesto delle guerre puniche. Usa il lessico della diplomazia romana."
  ),
  L(
    "Seneca philosophus Neroni scrīpsit: 'Recēde in tē ipse quantum potes; cum his versāre qui tē meliōrem factūrī sunt. Admitte quōs meliōrem factūrus es. Omnia aliēna sunt, tempus tantum nostrum est.'",
    "Una lettera autentica di Seneca (Epistulae Morales I,1) come modello di prosa filosofica. Si lavora sul futuro participio come espressione di intenzione (factūrī sunt, factūrus es). Il tema del tempo come unica vera ricchezza è fondamentale nella filosofia senecana.",
    [v("recēdere in sē","ritirarsi in se stesso, raccogliersi"), v("quantum potes","quanto puoi"), v("versāre cum","frequentare, stare con (+ abl.)"), v("meliōrem facere","migliorare (rendere migliore)"), v("factūrī sunt","che ti renderanno (fut. part.)"), v("admitte","accogli, ammetti (imper.)"), v("aliēnus/a","altrui, di altri"), v("tantum","solo, soltanto"), v("tempus","tempo (III decl. neutro)"), v("nostrum","nostro, di noi")],
    "Lo studente legge una lettera autentica di Seneca. Comprende il participio futuro come espressione di intenzione. Coglie il pensiero filosofico senecano sul tempo. Analizza la struttura della prosa moralistica latina."
  ),
  L(
    "Tacitus de Germanis scrīpsit: 'Germāni corpora sua nōn induunt vestibus — pellibus utuntur. Silvas colunt. Virtutem bello probant. Aurō argentōque nōn dēlectantur ut Rōmānī. Simpliciōrēs et fortiorēs quam nōs sunt — sed saeviorēs quoque.'",
    "Un brano adattato dalla Germania di Tacito come esempio di etnografia critica. Si lavora sul comparativo (simpliciōrēs, fortiorēs, saeviorēs) e sull'uso di ut per il confronto. Il testo offre un punto di vista critico sulla civiltà romana dal di fuori.",
    [v("induere","indossare, vestire"), v("pellis/pellis","pelle, pelliccia (III decl.)"), v("utuntur + abl.","usano, si servono di (dep.)"), v("colunt","coltivano; venerano"), v("probare","provare, dimostrare"), v("aurum","oro"), v("argentum","argento"), v("dēlectantur","si dilettano, godono (pass.)"), v("quam nōs","di noi (comparazione)"), v("saevus/a","feroce, crudele")],
    "Lo studente legge un testo etnografico da Tacito adattato. Usa il comparativo degli aggettivi in contesti comparativi. Comprende la struttura ut + comparazione. Conosce la visione romana dei popoli germanici."
  ),
  L(
    "Plinius Minor patruō suō post mortem scrīpsit: 'Vidistī, avuncule, quōmodo nūbes surgeret. Haesistī et in lītore resedit̄istī. Nautae tē monuērunt ut fugerēs — tū nōluistī. Periistī — sed glōria tua manet.'",
    "Una lettera immaginaria a Plinio il Vecchio dopo la sua morte sul Vesuvio. Si lavora sul congiuntivo indiretto (ut fugerēs) dipendente da monuērunt, e sul piuccheperfetto come azione anteriore. Il contrasto tra la fuga consigliata e la scelta di restare è il nodo drammatico.",
    [v("patruus","zio paterno (avunculus: zio materno)"), v("quōmodo","come, in che modo (indir.)"), v("haeserunt","si fermarono, rimasero (perf. di haerēre)"), v("resedit","si sedette (perf. di residēre)"), v("monuērunt ut","consigliarono di (monēre + cong.)"), v("nōluistī","non hai voluto (perf. di nōlle)"), v("periistī","sei morto (perf. di perīre)"), v("glōria","gloria, fama"), v("manet","rimane, dura")],
    "Lo studente comprende la costruzione monēre ut + congiuntivo imperfetto. Usa il piuccheperfetto per azioni anteriori al passato. Legge un testo epistolare con struttura drammatica. Conosce la figura di Plinio il Vecchio."
  ),
  L(
    "Vergilius in Aenēide scrīpsit: 'Sunt lacrimae rērum et mentem mortālia tangunt.' Aenēas Troiam ārsisse vidit et lacrimāvit. Antiqua patria perīerat. Nova patria expectanda erat. Hoc est fātum hērōis — amittere ut inveniās.",
    "Un verso autentico dell'Eneide (I,462) come punto di arrivo dell'A2.2. Si lavora sull'interpretazione di un verso denso (sunt lacrimae rērum), sulla costruzione accusativo + infinito (Troiam ārsisse) e sul gerundivo con esse per esprimere necessità futura.",
    [v("lacrimae rērum","le lacrime delle cose (celebre espressione)"), v("mortālia","le cose mortali (pl. neutro sostantivato)"), v("tangunt","toccano, commuovono"), v("ārsisse","essere bruciata (perf. inf. di ārdēre)"), v("lacrimāvit","pianse (perf.)"), v("perīerat","era perita (piucch. di perīre)"), v("expectanda erat","doveva essere attesa (gerundivo + esse)"), v("fātum","destino, fato"), v("hērōs","eroe (dal greco)"), v("amittere","perdere")],
    "Lo studente comprende e interpreta un verso autentico dell'Eneide. Analizza la costruzione accusativo + infinito con verbo di percezione. Usa il gerundivo con esse per necessità. Comprende la visione del destino nella poesia epica latina."
  ),
  L(
    "Caesar Gallōs vincere solebat sed Vercingetorigem vincere nōn facile erat. Vercingetorix omnēs Gallōs in ūnum convocāvit et dīxit: 'Sī vinciendum est, vinciātur — sed prō libertāte!' Alesia obsessa est et tandem Vercingetorix sē dedidit.",
    "La battaglia di Alesia (52 a.C.) e la resa di Vercingetorige come testo storico di sintesi. Si consolidano: gerundivo, congiuntivo concessivo (sī vinciendum est), proposizione temporale (obsessa est et). Testo narrativo complesso.",
    [v("solēbat","era solito, soleva (solēre semi-dep.)"), v("convocāvit","convocò, radunò"), v("prō libertāte","per la libertà (prō + abl.)"), v("si vinciendum est","se si deve essere sconfitti"), v("vinciātur","si sia sconfitti (cong. III sing. pass.)"), v("Alesia","Alesia (oppido della Gallia)"), v("obsessa est","fu assediata (pass. perf.)"), v("tandem","alla fine, finalmente"), v("sē dedidit","si arrese (sē dedere)")],
    "Lo studente comprende il congiuntivo concessivo (sī... vinciātur). Usa il gerundivo impersonale passivo in frasi complesse. Legge una narrazione storica su Vercingetorige. Conosce la battaglia di Alesia e la fine della resistenza gallica."
  ),
  L(
    "Nunc fīnis huius cursūs adest. Quid didicistī? Lēgistī Caesarem, Vergilium, Catullum, Senecam, Livium, Tacitum. Audīvistī vōcem Rōmānōrum — nōn ex librīs grammaticae, sed ex verbīs ipsīs. Pergā et cotīdiē aliquid Latīnē lege.",
    "Lezione conclusiva dell'A2.2: bilancio del percorso svolto e proiezione verso la lettura autonoma di autori classici. Si ripassano gli autori incontrati e si dà agli studenti un'agenda per l'apprendimento autonomo. Preparazione al livello B1.",
    [v("fīnis","fine, conclusione (III decl. masch./femm.)"), v("adest","è qui, è giunto (adesse)"), v("lēgistī","hai letto (perf. di legere)"), v("audīvistī","hai ascoltato (perf. di audīre)"), v("vōx Rōmānōrum","la voce dei Romani"), v("ex verbīs ipsīs","dalle loro stesse parole"), v("perge!","continua! (imper. di pergere)"), v("cotīdiē","ogni giorno, quotidianamente"), v("aliquid","qualcosa (pron. indef. neutro)")],
    "Lo studente fa il bilancio delle competenze raggiunte nel livello A2.2. Comprende un testo di motivazione e orientamento alla lettura autonoma. Riconosce gli autori classici affrontati nel corso. È pronto per il livello B1."
  ),
  L(
    "Recapitulātiō et praeparātiō. Mārcus nunc B1 studēbit. Fortasse Caesarem integrum leget, aut Cicerōnis orātiōnēs. Videt quantum iter fēcerit. 'Graecia capta ferum victōrem cēpit' — Horātius dixit. Nōs quoque Graecia et Rōma cēpit.",
    "Revisione finale con prospettiva culturale ampia. La citazione di Orazio (Ep. II,1,156) — la Grecia conquistata ha conquistato il feroce vincitore — introduce la riflessione sul lascito greco-latino nella cultura europea. Chiusura del percorso A2.",
    [v("praeparātiō","preparazione"), v("fortasse","forse"), v("integer/integra","intero, completo"), v("orātiō","discorso, orazione"), v("quantum iter fēcerit","quanta strada ha fatto (AcI)"), v("capta","conquistata (part. perf. pass.)"), v("ferus/a","feroce, selvaggio"), v("victor/victoris","vincitore"), v("cēpit","conquistò; prese (ambiguità voluta)")],
    "Lo studente comprende una citazione autentica di Orazio e ne coglie l'ironia culturale. Sintetizza il percorso A2 e si proietta verso il B1. Riflette sul rapporto tra cultura greca e romana come fondamento della civiltà europea."
  ),
]

print("Content data loaded: lat-a11, lat-a12, lat-a21, lat-a22 defined.")
print(f"lat-a11: {len(LAT_A11)} lessons, lat-a12: {len(LAT_A12)} lessons, lat-a21: {len(LAT_A21)} lessons, lat-a22: {len(LAT_A22)} lessons")
