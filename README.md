# Book Byen: en bedre oversigt over dine tider

Et brugerscript til [Book Byen](https://www.bookbyen.brnd.com/), Københavns Kommunes bookingsystem for baner og
lokaler. Det gør siden **Tider**, hvor du ser dine bookinger, langt nemmere at overskue: kolonnerne kan sorteres,
bookingerne er farvet efter ugedag og bane, og du kan med det samme se, hvilke faste tider der kan fornyes.

Scriptet er lavet af en bruger og har ingen forbindelse til Københavns Kommune.

## Hvad scriptet gør

**Sortering.** Klik på en kolonneoverskrift for at sortere efter den, og klik igen for at vende rækkefølgen.
Valget bliver husket. Som standard sorteres der efter ugedag, tid, bane og dato, så hver fast tid står samlet.

**Farver.** Hver ugedag har sin egen farve (fx tirsdag blå og søndag grøn), og hver bane har sin egen nuance af
den. Søndag bane A har altså altid samme farve. Afviste bookinger er grå og overstreget.

**Mere læsevenlig tabel.**

- En ny kolonne viser ugedagen.
- Banen står i kort form, fx "Squash A" i stedet for "Squash (Squash - Opdelt) - Squash A".
- Datoerne står som "27. okt – 17. nov" med antal uger nedenunder.
- Kolonner, der ikke siger noget nyt, er skjult: Booket af, Aktivitet, den tomme Dato og Anlæg, når alle
  bookinger er samme sted. Tabellen kan derfor ses uden at scrolle til siden.
- Alle bookinger vises på én side.

**Knapperne direkte i rækken.** "Rediger" og "Forny" står som knapper i hver række i stedet for at være gemt i en
menu yderst til højre.

**Kan tiden fornyes?** For nogle faste tider svarer Book Byen "Dette link er udløbet", når man trykker på
"Forny fast banetid". Scriptet åbner fornyelsessiden i baggrunden og viser resultatet på knappen:

- Virker fornyelsen, hedder knappen fx **"Forny til 30. mar"**. Hold musen over knappen for at se perioden og prisen.
- Virker den ikke, er knappen grå og hedder **"Kan ikke fornys"**.

Resultatet huskes i et kvarter, så siden ikke hentes igen, hver gang du genindlæser.

### Hvad scriptet ikke gør

Scriptet ændrer kun, hvordan siden ser ud i din egen browser. Det booker, fornyer og betaler ikke noget. Når
det tjekker en fornyelse, åbner det kun siden, ligesom hvis du selv havde trykket på linket, men det trykker
ikke på "Book". Knapperne gør præcis det samme som punkterne i Book Byens egen menu.

## Installation

1. Installér udvidelsen [Tampermonkey](https://www.tampermonkey.net/) i din browser (Violentmonkey virker også).
   I Chrome og Edge skal du desuden slå **Tillad brugerscripts** til under udvidelsens detaljer.
2. Åbn **[installationslinket](https://raw.githubusercontent.com/kekwin/bookbyen-userscript/main/bookbyen-tider.user.js)**,
   og tryk på **Installér** i Tampermonkey.
3. Gå til Book Byen, log ind, og åbn **Tider**.

Tampermonkey holder selv scriptet opdateret.

## Til udviklere

Book Byen henter tabellen med AJAX (`POST /TiderBooking/GetBookingList`, som svarer med server-renderet HTML med
alle rækker). Scriptet holder derfor øje med siden og forbedrer tabellen `#tiderbookinglisttbl`, hver gang den
bliver tegnet. Cellerne genkendes på deres `data-label` (fx `BookingDate`, `disp` og `Bookingtime`). Ændrer Book
Byen dem, skal scriptet rettes. Ugedagen regnes ud fra den første dato i perioden.

En fornyelse regnes for at virke, når fornyelsessiden indeholder tider, der kan bookes (`clsCHKMultiBooking`).
Periode, pris og ledighed læses fra den første af dem. Teksten "udløbet" kan ikke bruges, fordi den også står i
en skjult dialog om udløbet session på alle sider.

Farverne: grundfarven pr. ugedag står i `HUES`. For hver bane (A, B, C … eller 1, 2, 3 …) drejes farven 20° og
bliver lidt mørkere.

En ny version skal have et højere `@version` i scriptets hoved; ellers henter Tampermonkey den ikke.

## Historik

- **1.1.0** (16. oktober 2026): Forny-knappen viser, om fornyelsen virker, og hvortil der fornyes. Datoer
  skrives som "30. mar".
- **1.0.0** (16. oktober 2026): Sortering, farver efter ugedag og bane, ugedag, kort banenavn, antal uger,
  knapper i rækken og ingen vandret scroll.
