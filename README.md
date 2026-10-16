# Book Byen: bedre "Tider"

Brugerscript til [Book Byen](https://www.bookbyen.brnd.com/) (Københavns Kommunes bookingsystem for baner og
lokaler), der gør siden **Tider** (`/tider`, mine bookinger) til at bruge:

- **Sortering:** klik på en kolonneoverskrift for at sortere (klik igen for omvendt). Valget huskes.
  Standard er ugedag, så tid, bane og dato, så hver fast tid står samlet.
- **Farver:** én farve pr. ugedag (tirsdag blå, søndag grøn, mandag orange …) og en nuance pr. bane, så fx
  søndag bane A altid har samme farve. Afviste bookinger er grå og overstreget.
- **Ugedag** som ny kolonne, **banen** i kort form ("Squash A" i stedet for "Squash (Squash - Opdelt) - Squash A"),
  og **datoerne** som "27. okt – 17. nov" med antal uger.
- **Ingen vandret scroll:** kolonner, der aldrig siger noget (Booket af, Aktivitet, den tomme Dato, og Anlæg,
  når alle er det samme sted), er skjult.
- **Knapperne fremme:** "Rediger" og "Forny" står direkte i rækken i stedet for i menuen ude til højre. "Forny" er
  fremhævet, så det er tydeligt, hvilke tider der kan fornyes.
- Alle rækker vises på én side.

Scriptet ændrer kun visningen i min egen browser. Det sender intet og klikker ikke på noget af sig selv; knapperne
gør det samme som menupunkterne.

## Installation

1. Installér [Tampermonkey](https://www.tampermonkey.net/) i Chrome (eller Violentmonkey). I Chrome og Edge skal
   "Tillad brugerscripts" være slået til under udvidelsens detaljer.
2. Åbn **[installationslinket](https://raw.githubusercontent.com/kekwin/bookbyen-userscript/main/bookbyen-tider.user.js)**
   og tryk "Installér" i Tampermonkey.
3. Gå til Book Byen, log ind og åbn **Tider**.

Tampermonkey tjekker selv for opdateringer (samme adresse). En ny version skal have et højere `@version` i
scriptets hoved; ellers henter Tampermonkey den ikke.

## Sådan virker det

Book Byen henter tabellen med AJAX (`POST /TiderBooking/GetBookingList`, server-renderet HTML med alle rækker),
så scriptet holder øje med siden og forbedrer tabellen `#tiderbookinglisttbl`, hver gang den bliver tegnet.
Cellerne genkendes på deres `data-label` (fx `BookingDate`, `disp`, `Bookingtime`); ændrer Book Byen dem, skal
scriptet rettes. Ugedagen regnes ud fra første dato.

Farver: grundfarven (hue) pr. ugedag står i `HUES`; banen drejer farven 20° og gør den lidt mørkere pr. bogstav
(A, B, C …) eller nummer.

## Historik

- 1.0.0 (16. oktober 2026): sortering, farver pr. ugedag og bane, ugedag, kort bane, antal uger, knapper i rækken,
  ingen vandret scroll.
