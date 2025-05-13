const currencyMap = {};
    const currencyNames = {
  "AUD": "Австралийский доллар 🇦🇺",
  "AZN": "Азербайджанский манат 🇦🇿",
  "AMD": "Армянский драм 🇦🇲",
  "BYN": "Белорусский рубль 🇧🇾",
  "BRL": "Бразильский реал 🇧🇷",
  "HUF": "Венгерский форинт 🇭🇺",
  "HKD": "Гонконгский доллар 🇭🇰",
  "GEL": "Грузинский лари 🇬🇪",
  "DKK": "Датская крона 🇩🇰",
  "AED": "Дирхам ОАЭ 🇦🇪",
  "USD": "Доллар США 🇺🇸",
  "EUR": "Евро 🇪🇺",
  "INR": "Индийская рупия 🇮🇳",
  "IRR": "Иранский риал 🇮🇷",
  "CAD": "Канадский доллар 🇨🇦",
  "CNY": "Китайский юань 🇨🇳",
  "KWD": "Кувейтский динар 🇰🇼",
  "KGS": "Киргизский сом 🇰🇬",
  "MYR": "Малайзийский ринггит 🇲🇾",
  "MXN": "Мексиканское песо 🇲🇽",
  "MDL": "Молдавский лей 🇲🇩",
  "NOK": "Норвежская крона 🇳🇴",
  "PLN": "Польский злотый 🇵🇱",
  "SAR": "Саудовский риял 🇸🇦",
  "RUB": "Российский рубль 🇷🇺",
  "XDR": "СДР (спецправа) 🌐",
  "SGD": "Сингапурский доллар 🇸🇬",
  "TJS": "Таджикский сомони 🇹🇯",
  "THB": "Тайский бат 🇹🇭",
  "TRY": "Турецкая лира 🇹🇷",
  "UZS": "Узбекский сум 🇺🇿",
  "UAH": "Украинская гривна 🇺🇦",
  "GBP": "Фунт стерлингов 🇬🇧",
  "CZK": "Чешская крона 🇨🇿",
  "SEK": "Шведская крона 🇸🇪",
  "CHF": "Швейцарский франк 🇨🇭",
  "ZAR": "Южноафриканский рэнд 🇿🇦",
  "KRW": "Южнокорейская вона 🇰🇷",
  "JPY": "Японская иена 🇯🇵",
  "KZT": "Казахстанский тенге 🇰🇿"
};

    let amountInput, resultOutput;

    const updateResult = () => {
      const amount = parseFloat(amountInput.rawValue.replace(/\s/g, ''));
      const from = document.getElementById("fromCurrency").value;
      const to = document.getElementById("toCurrency").value;
      document.getElementById("currencyLabel").textContent = to;
      if (!from || !to || isNaN(amount)) return resultOutput.set(0);
      const converted = amount * (currencyMap[from] / currencyMap[to]);
      resultOutput.set(converted);
    };

    const swapCurrencies = () => {
      const from = document.getElementById("fromCurrency");
      const to = document.getElementById("toCurrency");
      [from.value, to.value] = [to.value, from.value];
      updateResult();
    };

    const loadCurrency = async () => {
      try {
        const res = await fetch("https://api.allorigins.win/raw?url=https://nationalbank.kz/rss/rates_all.xml",{cache: "no-store"});
        const xml = await res.text();
        localStorage.setItem("currency", xml);
        localStorage.setItem("currency_time", new Date().toISOString());
        renderCurrency(xml);
        showOfflineNotice(false);
      } catch (e) {
        const cached = localStorage.getItem("currency");
        const cachedTime = localStorage.getItem("currency_time");
        if (cached && cachedTime) {
          renderCurrency(cached);
          showOfflineNotice(true, cachedTime);
        } else {
          document.getElementById("render-alert-no-data").classList.remove("d-none");
        }
      }
      finally {
        document.getElementById("loading").classList.add("d-none");
        document.getElementById("response").classList.remove("d-none");
      }
    };

    const renderCurrency = xmlStr => {
      const xml = new DOMParser().parseFromString(xmlStr, "text/xml");
      const items = [...xml.querySelectorAll("item")];
      const fromSelect = document.getElementById("fromCurrency");
      const toSelect = document.getElementById("toCurrency");

      currencyMap["KZT"] = 1;
      fromSelect.innerHTML = toSelect.innerHTML = '';

      const allCodes = ["KZT"];

      items.forEach(item => {
        const code = item.querySelector("title")?.textContent;
        const rate = parseFloat(item.querySelector("description")?.textContent);
        const quant = parseFloat(item.querySelector("quant")?.textContent);
        const value = rate / quant;
        currencyMap[code] = value;
        allCodes.push(code);
      });

      allCodes.forEach(code => {
        const label = currencyNames[code] || code;
        const option = `<option value="${code}" title="${label}">${label}</option>`;
        fromSelect.innerHTML += option;
        toSelect.innerHTML += option;
      });

      fromSelect.value = "KZT";
      toSelect.value = "USD";
      document.getElementById("currencyLabel").textContent = "USD";
      updateResult();
    };

    window.addEventListener("load", () => {
      loadCurrency();
      amountInput = new AutoNumeric("#amount", {
        digitGroupSeparator: ' ',
        decimalCharacter: '.',
        decimalPlaces: 2
      });
      resultOutput = new AutoNumeric("#result", {
        readOnly: true,
        watchExternalChanges: true,
        digitGroupSeparator: ' ',
        decimalCharacter: '.',
        decimalPlaces: 2
      });
    });

    document.getElementById("fromCurrency").addEventListener("change", updateResult);
    document.getElementById("toCurrency").addEventListener("change", updateResult);
    document.getElementById("amount").addEventListener("input", updateResult);

    function showOfflineNotice(offline, time) {
      if (offline) {
        document.getElementById("render-alert-offline").classList.remove("d-none");
        const d = new Date(time);
        document.getElementById("render-offline").innerHTML = `<h5>⚠️ Без интернета</h5><p class="m-0">Данные от ${d.toLocaleString()}</p>`;
      }
    }