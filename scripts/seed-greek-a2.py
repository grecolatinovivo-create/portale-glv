#!/usr/bin/env python3
"""seed-greek-a2.py — Greek A2.1 and A2.2"""

import psycopg2, json

DB_URL = "postgresql://neondb_owner:npg_wRBXT6Azv0Vj@ep-late-sea-aqyed9xw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def v(term, meaning, notes=None):
    d = {"term": term, "meaning": meaning}
    if notes: d["notes"] = notes
    return d
def L(tf, cs, kv, lo):
    return {"textFragment": tf, "contentSummary": cs, "keyVocabulary": kv, "learningObjectives": lo}

GR_A21 = [
  L("Ὁ Δικαιόπολις πρὸς τὸν Πειραιᾶ ἦλθεν. Ἐκεῖ ναῦς πολλαὶ ἦσαν· ἔμποροι δὲ καὶ ναῦται ἐν τῷ λιμένι ἦσαν. Ναῦς μία εἰς τὴν Κόρινθον ἔπλει.",
   "Il Pireo e il commercio marittimo ateniese. Si approfondisce l'imperfetto di essere (ἦσαν) e di πλέω. Si introduce il numerale εἷς, μία, ἕν come aggettivo. Contesto culturale: il porto del Pireo come centro economico dell'impero ateniese.",
   [v("Πειραιεύς, -έως","Pireo (III decl. irr.)"), v("ναῦς, νεώς","nave (irr. IV decl.)"), v("ἔμπορος","mercante, commerciante"), v("ναύτης, -ου","marinaio (I decl. masch.)"), v("λιμήν, -ένος","porto (III decl.)"), v("εἷς / μία / ἕν","uno/una/un (numerale irr.)"), v("ἔπλει","navigava (imperf. di πλέω)")],
   "Lo studente declina ναῦς come sostantivo irregolare. Usa εἷς/μία/ἕν come numerale cardinale. Legge un testo descrittivo sul porto. Conosce il ruolo del Pireo nell'economia ateniese."),
  L("Ὁ ἔμπορος τῷ Δικαιοπόλιδι λέγει ὅτι ἡ ναῦς σίτου γέμει. Ὁ Δικαιόπολις ἐρωτᾷ· 'Πόθεν ἐρχῇ;' Ὁ ἔμπορος ἀποκρίνεται· 'Ἐκ τοῦ Πόντου ἐρχόμεθα.'",
   "Il commercio del grano dal Mar Nero. Si lavora sul genitivo del contenuto (σίτου γέμει = è piena di grano). Si introduce πόθεν (da dove?) come avverbio interrogativo. Forma del verbo alla 1ª plurale (ἐρχόμεθα).",
   [v("σῖτος","grano, frumento"), v("γέμει + gen.","è pieno di (γέμω + gen.)"), v("πόθεν;","da dove? (avv. interr.)"), v("ἐρχῇ","vieni, arrivi (2ª sing. di ἔρχομαι)"), v("Πόντος","Mar Nero (Ponto Eussino)"), v("ἐρχόμεθα","veniamo, arriviamo (1ª pl. di ἔρχομαι)")],
   "Lo studente usa γέμω + genitivo del contenuto. Comprende πόθεν come avverbio interrogativo. Usa la 1ª persona plurale dei verbi. Conosce le rotte commerciali del grano nel mondo greco."),
  L("Ὁ Δικαιόπολις βούλεται ναυτιλίαν μαθεῖν. Εἰσέρχεται εἰς τριήρη· ἡ γὰρ τριήρης ἕτοιμή ἐστιν ἐκπλεῖν. Ὁ κυβερνήτης αὐτὸν διδάσκει πῶς δεῖ κώπην ἐρέττειν.",
   "La trireme ateniese e la marina da guerra. Si lavora su πῶς + inf. come interrogativa indiretta (come bisogna). Si introduce ἐκπλέω come verbo composto. Contesto culturale: la trireme come simbolo della potenza navale ateniese.",
   [v("ναυτιλία","arte della navigazione"), v("εἰσέρχεται εἰς","entra in (εἰσέρχομαι + acc.)"), v("τριήρης, -ους","trireme (III decl.)"), v("ἐκπλεῖν","salpare (inf. di ἐκπλέω)"), v("κυβερνήτης","timoniere, pilota"), v("πῶς + inf.","come (interrogativa ind.)"), v("κώπη","remo"), v("ἐρέττειν","remare (inf. di ἐρέττω)")],
   "Lo studente comprende πῶς + infinitivo come interrogativa indiretta. Usa verbi composti con εἰσ- e ἐκ-. Conosce la struttura e il ruolo della trireme. Legge un testo tecnico sulla navigazione."),
  L("Ἐν τῇ ἐκκλησίᾳ οἱ πολῖται ψηφίζονται. Ὁ Περικλῆς λέγει· 'Ἡμεῖς δημοκρατίᾳ χρώμεθα.' Πάντες οἱ πολῖται ψῆφον ἔχουσιν. Γυναῖκες δὲ καὶ δοῦλοι οὐ ψηφίζονται.",
   "La democrazia ateniese. Si lavora su χράομαι + dativo (usare qualcosa). Si introduce il pronome personale ἡμεῖς (noi) con il verbo alla 1ª plurale. Contesto culturale critico: i limiti della democrazia ateniese (donne, schiavi esclusi).",
   [v("ἐκκλησία","assemblea del popolo"), v("ψηφίζονται","votano (ψηφίζομαι, dep.)"), v("ἡμεῖς","noi (pron. pers. 1ª pl.)"), v("δημοκρατία","democrazia"), v("χρώμεθα + dat.","usiamo (χράομαι, dep.)"), v("ψῆφος","voto, pietra del voto"), v("γυναῖκες","donne (nom. pl. di γυνή)")],
   "Lo studente usa χράομαι + dativo. Comprende ἡμεῖς come pronome personale di 1ª persona plurale. Legge un testo sulla democrazia ateniese. Riflette criticamente sui limiti della partecipazione democratica."),
  L("Ἐν Δελφοῖς ναὸς τοῦ Ἀπόλλωνος ἐστίν. Ἡ Πυθία χρησμοὺς λέγει. Κροῖσος ἤρετο· 'Εἰ ἐπὶ Πέρσας στρατεύσω, μεγάλην ἀρχὴν καταλύσω.' Ὁ χρησμὸς ἀμφίβολος ἦν.",
   "L'Oracolo di Delfi e il famoso responso a Creso (da Erodoto). Si introduce la protasi del periodo ipotetico (εἰ + futuro indicativo). Si lavora sull'ambiguità come tecnica retorica. Contesto culturale: Delfi, Apollo, la Pizia.",
   [v("Δελφοί","Delfi (pl. tant.)"), v("ναός","tempio"), v("Ἀπόλλων, -ωνος","Apollo"), v("Πυθία","Pizia (sacerdotessa di Delfi)"), v("χρησμός","responso oracolare"), v("Κροῖσος","Creso (re di Lidia)"), v("ἤρετο","chiese (aor. di ἐρωτάω)"), v("εἰ + fut.","se (protasi del periodo ipotetico reale)"), v("καταλύσω","distruggerò (fut. di καταλύω)"), v("ἀμφίβολος","ambiguo, a doppio senso")],
   "Lo studente comprende il periodo ipotetico con εἰ + futuro indicativo. Riconosce l'ambiguità come tecnica retorica. Conosce la storia di Creso e l'oracolo delfico. Legge un testo tratto da Erodoto adattato."),
  L("Ὁ Σόλων νόμους ἔγραψεν τοῖς Ἀθηναίοις. Ἐκέλευσεν πάντας τοὺς πολίτας νόμῳ ὑπακούειν, καὶ πλουσίους καὶ πένητας. Μετὰ δὲ ταῦτα ἀπεδήμησεν εἰς Αἴγυπτον.",
   "Solone e la legislazione ateniese. Si lavora su καί... καί (sia... sia) come correlazione inclusiva. Si introduce ἀποδημέω come verbo composto frequente. Contesto storico: Solone come legislatore e fondamento del diritto attico.",
   [v("Σόλων, -ωνος","Solone (legislatore)"), v("νόμος","legge"), v("ἔγραψεν","scrisse (aor. di γράφω)"), v("ὑπακούειν + dat.","obbedire a (inf.)"), v("καί... καί","sia... sia (correlazione)"), v("πλούσιος","ricco"), v("πένης, -ητος","povero (III decl.)"), v("ἀπεδήμησεν","partì per l'estero (aor. di ἀποδημέω)"), v("Αἴγυπτος","Egitto")],
   "Lo studente usa καί... καί come correlazione. Comprende ὑπακούω + dativo. Conosce Solone e la sua importanza per il diritto ateniese. Legge un testo storico sulla legislazione."),
  L("Ἐν τῷ γυμνασίῳ οἱ νέοι ἐγυμνάζοντο. Ἔτρεχον, ἐπάλαιον, ἔπαιζον. Ὁ παιδοτρίβης τοὺς νέους ἐκέλευεν καλῶς ποιεῖν. Ὁ καλὸς κἀγαθὸς ἀνήρ σῶμα καὶ ψυχὴν ἀσκεῖ.",
   "Il ginnasio e l'educazione fisica nella paideia greca. Si consolida l'imperfetto di più verbi in contesto narrativo. Si introduce l'espressione καλὸς κἀγαθός (crasi per καὶ ἀγαθός) come ideale dell'uomo greco. Contesto culturale: l'educazione nella Grecia classica.",
   [v("γυμνάσιον","ginnasio (luogo dell'allenamento)"), v("νέοι","giovani"), v("ἐγυμνάζοντο","si allenavano (imperf. dep.)"), v("ἐπάλαιον","lottavano (imperf. di παλαίω)"), v("παιδοτρίβης","maestro di ginnastica"), v("καλῶς ποιεῖν","fare bene, comportarsi bene"), v("καλὸς κἀγαθός","bello e buono (crasi)","ideale dell'uomo greco"), v("ἀσκεῖ","esercita, allena (ἀσκέω)")],
   "Lo studente comprende la crasi καλὸς κἀγαθός. Usa l'imperfetto di più verbi in contesto narrativo. Conosce il ginnasio e la paideia greca. Legge un testo sull'educazione nel mondo antico."),
  L("Ὁ Δικαιόπολις εἰς θέατρον εἰσέρχεται. Ἡ τραγῳδία ἄρχεται. Ὁ χορὸς λέγει· 'Ὦ Ζεῦ, τί χρὴ παθεῖν;' Ὁ ἀκροατὴς κλαίει· τοιαύτη γὰρ ἡ τραγικὴ κάθαρσίς ἐστιν.",
   "Il teatro: tragedia e catarsi. Si introduce χρή + infinito come variante di δεῖ. Si lavora su τοιοῦτος/αύτη/οῦτον come aggettivo dimostrativo di qualità (tale, del tipo che). Contesto culturale: la katharsis aristotelica e il teatro come istituzione.",
   [v("ἄρχεται","comincia (ἄρχομαι, dep.)"), v("χορός","coro"), v("χρή + inf.","bisogna, occorre (impers.)"), v("παθεῖν","soffrire (aor. inf. di πάσχω)"), v("ἀκροατής","spettatore, ascoltatore"), v("κλαίει","piange (κλαίω)"), v("τοιαύτη","tale, di questo tipo (femm. di τοιοῦτος)"), v("κάθαρσις","catarsi, purificazione (Aristotele)")],
   "Lo studente usa χρή + infinito come costrutto impersonale. Comprende τοιοῦτος come aggettivo dimostrativo. Conosce il concetto aristotelico di catarsi. Legge un testo sulla funzione del teatro nella polis."),
  L("Ξενοφῶν ἐν τῇ Ἀναβάσει γράφει· 'Κῦρος ἐβασίλευεν τῆς Ἀσίας. Ἐβούλετο τὴν βασιλείαν ἔχειν. Στρατὸν δὲ Ἑλλήνων ἐμισθώσατο.'",
   "Senofonte e l'Anabasi: Ciro il Giovane e i Diecimila. Si lavora su βασιλεύω + genitivo (regnare su). Si introduce μισθόομαι come verbo medio con senso attivo (assumere a proprio servizio). Contesto storico: la spedizione dei Diecimila.",
   [v("Ξενοφῶν, -ῶντος","Senofonte (storico e filosofo)"), v("Ἀνάβασις","Anabasi (salita all'interno)"), v("Κῦρος","Ciro il Giovane"), v("ἐβασίλευεν + gen.","regnava su (imperf. di βασιλεύω)"), v("βασιλεία","regno, potere regio"), v("στρατός","esercito"), v("ἐμισθώσατο","assoldò (aor. med. di μισθόομαι)"), v("Ἕλληνες","Greci", "i Diecimila mercenari")],
   "Lo studente usa βασιλεύω + genitivo. Comprende il valore del medio (μισθόομαι = assumere per sé). Conosce la spedizione dei Diecimila. Legge un testo tratto dall'Anabasi di Senofonte."),
  L("Ὁ χορὸς τῆς Ἀντιγόνης λέγει· 'Πολλὰ τὰ δεινὰ κοὐδὲν ἀνθρώπου δεινότερον πέλει.' Ὁ ἄνθρωπος θαλάσσης κρατεῖ, γῆς κρατεῖ — ἀλλὰ θανάτου οὐ κρατεῖ.",
   "Il primo stasimo dell'Antigone di Sofocle (Ant. 332ss.): l'inno all'uomo. Si lavora sul superlativo (δεινότερον = più terribile). Si introduce κρατέω + genitivo (dominare su). Contesto letterario: Sofocle come poeta del limite umano.",
   [v("δεινός/ή/όν","terribile; prodigioso (doppio senso)"), v("δεινότερον","più terribile (comp. di δεινός)"), v("πέλει","è, esiste (poetico per ἐστίν)"), v("κρατεῖ + gen.","domina su (κρατέω)"), v("θάλασσα","mare"), v("θάνατος","morte"), v("κοὐδέν","e niente (crasi per καὶ οὐδέν)")],
   "Lo studente comprende il comparativo degli aggettivi in -τερος. Usa κρατέω + genitivo. Legge un testo poetico autentico da Sofocle (Antigone). Riflette sul tema del limite umano nella tragedia."),
  L("Δημοσθένης κατὰ Φιλίππου εἶπεν· 'Ὦ Ἀθηναῖοι, τί ποιεῖτε; Φίλιππος μέγας γίγνεται· ἡμεῖς δὲ καθεύδομεν.' Οἱ Ἀθηναῖοι ὅμως οὐκ ἤκουσαν.",
   "Demostene e le Filippiche. Si lavora sull'interrogativa retorica come figura di stile. Si introduce γίγνομαι come verbo frequente con senso di diventare. Contesto storico: Filippo II di Macedonia e il declino della polis.",
   [v("Δημοσθένης, -ους","Demostene (oratore)"), v("κατά + gen.","contro (preposizione)"), v("τί ποιεῖτε;","che cosa fate? (retorica)"), v("γίγνεται","diventa (γίγνομαι)"), v("καθεύδομεν","dormiamo (1ª pl. di καθεύδω)"), v("ὅμως","tuttavia, però"), v("ἤκουσαν","ascoltarono (aor. di ἀκούω)")],
   "Lo studente comprende l'interrogativa retorica come figura. Usa γίγνομαι come verbo copulativo. Conosce Demostene e il contesto macedone. Legge un testo di oratoria politica adattato."),
  L("Συνόψις: τί ἐμάθομεν; Ἐμάθομεν τὴν ἱστορίαν, τοὺς ποιητάς, τοὺς φιλοσόφους. Τώρα ἱκανοὶ ἐσμεν ἐπὶ τὸ Α2.2 βαδίζειν. Εὖ πράττετε, ὦ φίλοι.",
   "Revisione e consolidamento del livello A2.1. Si fa un bilancio degli autori e degli argomenti affrontati: storia (Erodoto, Tucidide, Senofonte), filosofia (Platone, Socrate), letteratura (Omero, Sofocle, Demostene). Preparazione al livello A2.2.",
   [v("συνόψις","sommario, sinossi"), v("ἐμάθομεν","abbiamo imparato (1ª pl. aor. di μανθάνω)"), v("ἱκανός/ή/όν","capace, sufficiente"), v("εὖ πράττετε","state bene! addio! (formula di congedo)"), v("φίλοι","amici (pl. di φίλος)")],
   "Lo studente consolida le strutture grammaticali dell'A2.1. Riconosce gli autori classici affrontati. Comprende un testo di congedo e revisione. È pronto per il livello A2.2."),
]

GR_A22 = [
  L("Ἐν τῷ Συμποσίῳ τοῦ Πλάτωνος Σωκράτης λέγει ὅτι ἡ Διοτίμα αὐτῷ ἐδίδαξεν τὰ ἐρωτικά. Ὁ ἔρως ἀρχὴν ἔχει ἀπὸ τοῦ ὡραίου σώματος πρὸς πᾶσαν τὴν καλλονήν.",
   "Il Simposio di Platone: Eros come ascesa verso il Bello. Si lavora su ἐδίδαξεν come aoristo transitivo con doppio accusativo (insegnò qualcosa a qualcuno). Si introduce la costruzione ἀπό... πρός come percorso concettuale. Contesto filosofico: la teoria platonica di Eros.",
   [v("Συμπόσιον","Simposio (dialogo platonico)"), v("Διοτίμα","Diotima di Mantinea (personaggio)"), v("τὰ ἐρωτικά","le cose d'amore (pl. neutro sostant.)"), v("ἔρως, -ωτος","Eros, amore (III decl.)"), v("ἀρχή","inizio, principio"), v("ὡραῖος/α/ον","bello nella stagione, in fiore"), v("καλλονή","bellezza (astratto)")],
   "Lo studente comprende διδάσκω con doppio accusativo. Legge un testo filosofico autentico adattato. Conosce la teoria platonica di Eros. Comprende la progressione ἀπό-πρός come struttura argomentativa."),
  L("Αἰσχύλος ἐποίησεν τὸν Προμηθέα Δεσμώτην. Ὁ Προμηθεὺς εἶπεν· 'Ἑκὼν ἑκὼν ἥμαρτον — οὐκ ἀρνήσομαι.' Τοὺς ἀνθρώπους ἀγαπᾷ, διό πῦρ αὐτοῖς ἔδωκεν.",
   "Eschilo e il Prometeo incatenato. Si lavora su ἑκών (volontariamente, di propria volontà) come participio in funzione avverbiale. Si introduce ἀρνέομαι come verbo deponente. Contesto letterario: Eschilo e la trilogia tragica.",
   [v("Αἰσχύλος","Eschilo (tragediografo)"), v("Προμηθεὺς Δεσμώτης","Prometeo incatenato"), v("ἑκών, ἑκοῦσα","volontariamente (part. agg.)"), v("ἥμαρτον","ho sbagliato, ho peccato (aor. di ἁμαρτάνω)"), v("ἀρνήσομαι","rinnegherò (fut. dep. di ἀρνέομαι)"), v("ἀγαπᾷ","ama (ἀγαπάω, contratto)"), v("διό","perciò, per questo"), v("πῦρ, πυρός","fuoco (III decl. neutro irr.)")],
   "Lo studente comprende ἑκών come participio in funzione modale. Usa ἀρνέομαι come deponente. Conosce Eschilo e il mito di Prometeo. Legge un testo tragico autentico adattato."),
  L("Πίνδαρος ἐπινίκιον ᾖσεν. 'Ἄριστον μὲν ὕδωρ' — οὗτος ὁ στίχος τῆς πρώτης Ὀλυμπιονίκης ἐστίν. Ἡ ποίησις οὐ μόνον ἀγῶνα ὑμνεῖ ἀλλὰ καὶ τὸ θεῖον δοξάζει.",
   "Pindaro e la lirica corale: la Prima Olimpica. Si lavora sull'apertura del componimento (ἄριστον μέν = ottima sì è l'acqua). Si introduce οὐ μόνον... ἀλλὰ καί come correlazione. Contesto letterario: la lirica celebrativa come genere della Grecia classica.",
   [v("Πίνδαρος","Pindaro (poeta lirico)"), v("ἐπινίκιον","ode epinicia (canto di vittoria)"), v("ᾖσεν","cantò (aor. di ᾄδω)"), v("ἄριστον","ottimo, migliore (superlativo)"), v("ὕδωρ, ὕδατος","acqua (III decl. neutro)"), v("στίχος","verso (di poesia)"), v("οὐ μόνον... ἀλλὰ καί","non solo... ma anche"), v("θεῖον","il divino (pl. neutro sostant.)"), v("δοξάζει","glorifica, esalta")],
   "Lo studente comprende οὐ μόνον... ἀλλὰ καί come correlazione. Conosce Pindaro e la lirica corale. Legge i versi apertura della Prima Olimpica. Comprende la funzione religiosa della poesia celebrativa."),
  L("Ἀριστοφάνης ἐκωμῴδει τοὺς πολιτικούς. Ἐν ταῖς Νεφέλαις κωμῳδεῖ τὸν Σωκράτη. Ὁ Στρεψιάδης λέγει· 'Ὦ Σώκρατες, δίδαξόν με τὸν ἥττονα λόγον κρατεῖν.' Ὁ Σωκράτης γελᾷ.",
   "Aristofane e la commedia: Le Nuvole. Si lavora su κρατέω + accusativo come variante di κρατέω + genitivo. Si introduce il doppio accusativo con διδάσκω (insegna a me la cosa). Contesto culturale: la commedia come critica sociale e politica.",
   [v("Ἀριστοφάνης","Aristofane (commediografo)"), v("ἐκωμῴδει","metteva in commedia (imperf. di κωμῳδέω)"), v("Νεφέλαι","Nuvole (commedia)"), v("Στρεψιάδης","Strepsiade (personaggio)"), v("δίδαξόν με","insegnami (aor. imper. + me acc.)"), v("ἥττων λόγος","il ragionamento debole (sofistico)"), v("γελᾷ","ride (γελάω, contratto)")],
   "Lo studente comprende il doppio accusativo con διδάσκω. Conosce Aristofane e la commedia attica. Legge un dialogo da Le Nuvole adattato. Riflette sulla funzione satirica della commedia."),
  L("Θαλῆς εἶπεν ὅτι ἀρχὴ πάντων ὕδωρ ἐστίν. Ἡράκλειτος δὲ εἶπεν ὅτι πάντα ῥεῖ. Παρμενίδης ἔλεγεν ὅτι τὸ ὄν ἀκίνητόν ἐστιν. Τίς ἀληθεύει;",
   "I Presocratici: Talete, Eraclito, Parmenide. Si consolida la completiva con ὅτι + indicativo per il discorso indiretto. Si lavora sul participio τό ὄν (l'essere, il presente) come gerundio sostantivato. Contesto filosofico: l'ontologia presocratica.",
   [v("Θαλῆς","Talete (filosofo di Mileto)"), v("ἀρχή πάντων","principio di tutte le cose"), v("Ἡράκλειτος","Eraclito"), v("πάντα ῥεῖ","tutto scorre (massima)"), v("Παρμενίδης","Parmenide"), v("τό ὄν","l'essere (part. pres. di εἰμί sostant.)"), v("ἀκίνητος/ον","immobile"), v("ἀληθεύει","dice la verità (ἀληθεύω)")],
   "Lo studente consolida ὅτι + indicativo nel discorso indiretto. Comprende il participio sostantivato (τό ὄν). Conosce i principali presocratici. Legge un testo di filosofia presocratica adattato."),
  L("Ἐν Ὀλύμπῳ οἱ θεοὶ ᾤκουν. Ζεὺς πάντων ἐβασίλευεν. Ποσειδῶν δὲ τῆς θαλάσσης ἦρχεν, Ἀΐδης δὲ τοῦ κάτω κόσμου. Ἀθηνᾶ ἔφρουρεν τὴν πόλιν.",
   "Il pantheon greco: Zeus, Poseidone, Ade, Atena. Si lavora su ἄρχω + genitivo (governare su) e su κάτω come avverbio/aggettivo (di sotto, inferiore). Si consolida βασιλεύω + genitivo. Contesto mitologico: la divisione del cosmo tra gli dèi.",
   [v("Ὄλυμπος","Olimpo (monte degli dèi)"), v("Ζεύς, Διός","Zeus (III decl. irr.)"), v("ἄρχω + gen.","governa, comanda su"), v("Ποσειδῶν, -ῶνος","Poseidone"), v("Ἀΐδης","Ade (dio degli Inferi)"), v("κάτω","di sotto, inferiore"), v("κόσμος","mondo, ordine"), v("Ἀθηνᾶ","Atena"), v("φρουρεῖ","custodisce (φρουρέω)")],
   "Lo studente usa ἄρχω + genitivo. Comprende κάτω come avverbio/aggettivo. Conosce il pantheon olimpico. Legge un testo mitologico sulla divisione del cosmo."),
  L("Θουκυδίδης γράφει περὶ τοῦ λοιμοῦ τῶν Ἀθηνῶν· 'Ἐγένετο μὲν γὰρ τὸ νόσημα... ἤρξατο δὲ ἐξ Αἰθιοπίας.' Πολλοὶ ἀπέθανον, καὶ αὐτὸς ὁ Περικλῆς.",
   "La peste di Atene in Tucidide (II,47ss.). Si lavora su ἄρχομαι + genitivo (iniziare da). Si introduce ἀπέθανον come aoristo irregolare di ἀποθνῄσκω. Contesto storico-letterario: la descrizione scientifica della peste in Tucidide.",
   [v("λοιμός","pestilenza, epidemia"), v("νόσημα, -ατος","malattia (III decl. neutro)"), v("ἐγένετο","avvenne (aor. di γίγνομαι)"), v("ἤρξατο + gen.","cominciò da (aor. dep. di ἄρχομαι)"), v("Αἰθιοπία","Etiopia"), v("ἀπέθανον","morirono (aor. irr. di ἀποθνῄσκω)"), v("αὐτός + nom.","egli stesso, lui in persona")],
   "Lo studente comprende ἄρχομαι + genitivo. Usa ἀπέθανον come aoristo irregolare. Conosce la descrizione della peste in Tucidide. Legge un testo storiografico con stile impersonale e scientifico."),
  L("Ὁ Ἐπίκτητος ἔλεγεν· 'Τῶν ὄντων τὰ μέν ἐστιν ἐφ' ἡμῖν, τὰ δὲ οὐκ ἐφ' ἡμῖν.' Ἐφ' ἡμῖν γνώμη, ὁρμή, ὄρεξις. Οὐκ ἐφ' ἡμῖν σῶμα, δόξα, ἀρχή.",
   "Epitteto e il manuale stoico (Enchiridion, 1). Si lavora su τά μέν... τά δέ come correlazione partitiva (le une cose... le altre). Si introduce ἐφ' ἡμῖν come espressione tecnica stoica (in nostro potere). Contesto filosofico: lo stoicismo come filosofia della libertà interiore.",
   [v("Ἐπίκτητος","Epitteto (filosofo stoico)"), v("τῶν ὄντων","delle cose che sono (gen. pl. part. di εἰμί)"), v("τά μέν... τά δέ","le une... le altre (correlazione)"), v("ἐφ' ἡμῖν","in nostro potere (loc. tecnica)"), v("γνώμη","giudizio, opinione"), v("ὁρμή","impulso, motivazione"), v("ὄρεξις, -εως","desiderio"), v("δόξα","reputazione, opinione"), v("ἀρχή","potere, carica")],
   "Lo studente comprende τά μέν... τά δέ come correlazione. Conosce l'Enchiridion di Epitteto. Comprende la distinzione stoica tra ἐφ' ἡμῖν e οὐκ ἐφ' ἡμῖν. Legge un testo di filosofia pratica."),
  L("Ἡ Σαπφὼ ἔγραψεν· 'Φαίνεταί μοι κῆνος ἴσος θέοισιν / ἔμμεν' ὤνηρ.' Ὁ ἄνδρας ἀντικρὺ σέθεν ἵζεται καὶ τᾶς ἁδυφώνω ἀκούει.",
   "Saffo: il frammento 31 (Phainetai moi). Si lavora sull'infinitivo con l'ausiliare di essere (ἔμμεν' = εἶναι in dialetto eolico). Contesto letterario: Saffo come poetessa del desiderio, il dialetto eolico della poesia arcaica.",
   [v("Σαπφώ","Saffo (poetessa di Lesbo)"), v("φαίνεταί μοι","mi sembra (φαίνομαι + dat.)"), v("κῆνος","quello (eolico per ἐκεῖνος)"), v("ἴσος θέοισιν","uguale agli dèi"), v("ἔμμεν'","essere (inf. eolico di εἰμί)"), v("ἀντικρύ + gen.","di fronte a"), v("ἵζεται","siede (ἵζω)"), v("ἁδύφωνος","dalla dolce voce")],
   "Lo studente riconosce le caratteristiche del dialetto eolico. Comprende φαίνομαι + dativo. Legge il frammento 31 di Saffo. Conosce la lirica monodica arcaica."),
  L("Πλούταρχος βίους παραλλήλους ἔγραψεν. Ἀλέξανδρον καὶ Καίσαρα παραβάλλει. Ὁ μέγας ἀνήρ οὐ μόνον στρατηγός ἐστιν ἀλλὰ καὶ φιλόσοφος.",
   "Plutarco e le Vite Parallele: Alessandro e Cesare. Si introduce παραβάλλω (confrontare) con doppio accusativo. Si consolida οὐ μόνον... ἀλλὰ καί. Contesto letterario: Plutarco come biografo e moralista dell'età imperiale.",
   [v("Πλούταρχος","Plutarco (biografo, I-II sec. d.C.)"), v("βίοι παράλληλοι","Vite Parallele (titolo)"), v("παραβάλλει","confronta (παραβάλλω + acc.)"), v("Καῖσαρ, -αρος","Cesare (nome latino)"), v("στρατηγός","generale, stratega"), v("φιλόσοφος","filosofo")],
   "Lo studente comprende παραβάλλω come verbo di confronto. Consolida οὐ μόνον... ἀλλά καί. Conosce Plutarco e le Vite Parallele. Legge un testo biografico della tarda antichità."),
  L("Τὸ Κατὰ Ἰωάννην Εὐαγγέλιον ἄρχεται· 'Ἐν ἀρχῇ ἦν ὁ Λόγος, καὶ ὁ Λόγος ἦν πρὸς τὸν Θεόν, καὶ Θεὸς ἦν ὁ Λόγος.'",
   "Il prologo del Vangelo di Giovanni (Gv 1,1) come testo di greco koiné. Si lavora sulla struttura triadica con ἦν (era). Si introduce πρός + accusativo in senso relazionale (era presso/rivolto a). Contesto culturale: la koiné greca come lingua del Nuovo Testamento.",
   [v("Κατὰ Ἰωάννην","Secondo Giovanni (titolo del Vangelo)"), v("εὐαγγέλιον","buona notizia, vangelo"), v("ἐν ἀρχῇ","in principio"), v("Λόγος","Parola, Logos"), v("πρὸς τὸν Θεόν","presso Dio, rivolto a Dio"), v("Θεός","Dio"), v("κοινή","comune (lingua koiné)")],
   "Lo studente legge il prologo di Giovanni in greco originale. Comprende πρός + accusativo in senso relazionale. Conosce la koiné greca come lingua del NT. Riflette sul concetto filosofico-teologico di Logos."),
  L("Τέλος τοῦ Α2. Ὁ μαθητὴς νῦν ἱκανός ἐστιν ἀναγινώσκειν κείμενα ἀρχαίου ἑλληνικοῦ. Ἐν τῷ Β1 αὐτὰ τὰ κείμενα ἀναγνώσεται — Ἡρόδοτον, Θουκυδίδην, Πλάτωνα.",
   "Lezione conclusiva del livello A2.2 e del percorso A2 completo. Riepilogo degli autori greci incontrati, delle strutture grammaticali padroneggiate (participio, congiuntivo, ottativo, infinitiva). Proiezione verso il B1 e la lettura di testi autentici.",
   [v("τέλος","fine"), v("μαθητής, -οῦ","studente, discepolo"), v("ἀναγινώσκειν","leggere (inf. di ἀναγιγνώσκω)"), v("κείμενα","testi (pl. neutro di κεῖμαι sostant.)"), v("ἀρχαῖον ἑλληνικόν","greco antico"), v("ἀναγνώσεται","leggerà (fut. di ἀναγιγνώσκω)")],
   "Lo studente consolida tutte le strutture grammaticali del livello A2. Riconosce gli autori principali della letteratura greca classica. È in grado di leggere brevi testi autentici adattati. È pronto per il livello B1."),
]

IDS_GR_A21 = [
  "40a0c30c-93e5-46fa-80ae-56134bbb8756",
  "6b709faf-d842-45ff-9bb7-e50074cf12f4",
  "dae4dcea-08d5-4432-9d31-9961a22b39ef",
  "0590a9c1-76ad-44d6-83d4-503034f97b0c",
  "156d00b9-2078-4499-bd15-8ce9594c5a8c",
  "49da73a0-51dc-4468-bac9-26a07a1a822a",
  "5329b648-c8af-421e-9f89-af0994732d20",
  "ddb1ff23-1afd-49c7-a556-0f2a3cf96d58",
  "2959d869-8cfe-499b-b883-0b913956733e",
  "12ca30c9-27dd-4a67-9953-95c6069243f7",
  "7748af17-1287-48a0-83f6-7d28aacc4224",
  "0f78261f-c683-4841-9c01-86141a5ec533",
]
IDS_GR_A22 = [
  "34ea7f17-79d2-4a1d-9b0d-9500d3b73b63",
  "62e3553f-60da-4260-9af3-6d3963cd6bf0",
  "aa504810-8d47-4841-8d90-fd012bd1a3b2",
  "c7de14a0-580e-41bb-bc2e-a5cc8ccabd0a",
  "ea348981-d0c9-4199-b4e2-a8a2c998a814",
  "380f8c9f-6f89-4622-baf2-56205ffc341e",
  "53f13d33-48d5-4bfb-a0d5-8243be591f7f",
  "ffe739cc-8d27-4dc6-a7bb-4959b5cd8b86",
  "defa39dd-5ba3-4c34-bc7e-37e49b734bd2",
  "0143a273-274f-445d-983f-e43485a7a1e0",
  "fc987b4d-ff25-4f9d-8c3e-94517b6d46d5",
  "7778ca44-5e94-4b55-9a02-3b6112199bd5",
]

def run():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    total = 0
    for ids, data, label in [
        (IDS_GR_A21, GR_A21, "gr-a21"),
        (IDS_GR_A22, GR_A22, "gr-a22"),
    ]:
        assert len(ids) == len(data), f"{label}: {len(ids)} vs {len(data)}"
        for lid, lesson in zip(ids, data):
            cur.execute("""UPDATE "Lesson" SET "textFragment"=%s,"contentSummary"=%s,"keyVocabulary"=%s::jsonb,"learningObjectives"=%s WHERE id=%s""",
                (lesson["textFragment"], lesson["contentSummary"],
                 json.dumps(lesson["keyVocabulary"], ensure_ascii=False),
                 lesson["learningObjectives"], lid))
            total += 1
        print(f"  ✓ {label}: {len(data)} lezioni")
    conn.commit(); conn.close()
    print(f"Totale: {total}")

if __name__ == "__main__":
    run()
