const BehaviorSubject = (initialValue) => {
  let value = initialValue;
  const observers = new Map();
  return {
    getValue: () => value,
    next: (nextValue) => {
      value = nextValue;
      observers.forEach((observer) => observer(value));
    },
    subscribe: (observer) => {
      const id = Symbol();
      observers.set(id, observer);
      observer(value);
      return () => observer.delete(id);
    },
  };
};

const FilterWidget = (el, json, visibleControls) => {
  const container = document.createElement("div");
  el.append(container);
  container.classList.add("FilterWidget");

  const filterStream = BehaviorSubject(
    new Map(json.columns.map((_, index) => [index, ""]))
  );

  const jsonStream = BehaviorSubject(json);

  filterStream.subscribe((filter) => {
    jsonStream.next({
      columns: json.columns,
      data: json.data.filter((dataItem) => {
        for (const [columnIndex, filterValue] of Array.from(filter.entries())) {
          if (filterValue !== "" && dataItem[columnIndex] !== filterValue) {
            return false;
          }
        }
        return true;
      }),
    });
  });

  json.columns
    .map((column, columnIndex) => ({ column, columnIndex }))
    .filter((i) => visibleControls.includes(i.column.code))
    .forEach(({ column, columnIndex }) => {
      const label = document.createElement("label");
      container.append(label);
      const title = document.createElement("div");
      label.append(title);
      const select = document.createElement("select");
      label.append(select);
      title.style.fontWeight = "bold";
      title.textContent = column.label;

      const addOption = (value, label) => {
        const option = document.createElement("option");
        select.append(option);
        option.value = value;
        option.textContent = label;
      };

      const options = [
        { value: "", label: "—" },
        ...[...new Set(json.data.map((dataItem) => dataItem[columnIndex]))].map(
          (value) => ({
            value,
            label:
              column.type === "unixtimestamp"
                ? new Date(value).toLocaleString()
                : value,
          })
        ),
      ];
      options.forEach(({ value, label }) => addOption(value, label));

      select.onchange = () => {
        filterStream.next(
          filterStream
            .getValue()
            .set(columnIndex, options[select.selectedIndex].value)
        );
      };
    });

  return {
    element: container,
    jsonStream,
  };
};

const VisualizerWidget = (el, jsonStream, visibleColumns) => {
  let _node;
  jsonStream.subscribe((json) => {
    const columns = (() => {
      const arr = json.columns.map((column, columnIndex) => ({
        column,
        columnIndex,
      }));
      return visibleColumns
        ? arr.filter((i) =>
          visibleColumns ? visibleColumns.includes(i.column.code) : true
        )
        : arr;
    })();
    _node?.parentNode.removeChild(_node);
    const container = document.createElement("div");
    _node = container;
    el.append(_node);
    const table = document.createElement("table");
    container.append(table);
    const thead = document.createElement("thead");
    table.append(thead);
    const headRow = document.createElement("tr");
    thead.append(headRow);
    columns.forEach(({ column }) => {
      const th = document.createElement("th");
      headRow.append(th);
      th.textContent = column.label;
    });
    const tbody = document.createElement("tbody");
    table.append(tbody);
    json.data.forEach((dataItem) => {
      const tr = document.createElement("tr");
      tbody.append(tr);
      columns.forEach(({ column, columnIndex }) => {
        const td = document.createElement("td");
        td.textContent = column.type === 'unixtimestamp'
          ? new Date(dataItem[columnIndex]).toLocaleString()
          : dataItem[columnIndex];
        tr.append(td);
      });
    });
  });
};

const demoData = {
  columns: [
    {
      code: "id",
      label: "id",
      type: "string",
    },
    {
      code: "name",
      label: "Название",
      type: "string",
    },
    {
      code: "category",
      label: "Категория",
      type: "string",
    },
    {
      code: "date",
      label: "Дата",
      type: "unixtimestamp",
    },
    {
      code: "value",
      label: "Значение",
      type: "number",
    },
  ],
  data: [
    ["item-1", "Фубар-2", "Мягкие", 1008536400, 659436],
    ["item-3", "Фубар-4", "Красные", 1603832400, 847592],
    ["item-5", "Черепашка-6", "Красные", 1132952400, 839218],
    ["item-7", "Пепега-8", "Прозрачные", 1007758800, 180952],
    ["item-9", "Черепашка-10", "Красные", 1604869200, 660033],
    ["item-11", "Черепашка-12", "Прозрачные", 1425070800, 334169],
    ["item-13", "Фубар-14", "Мягкие", 994881600, 939727],
    ["item-15", "Фубар-16", "Прозрачные", 1432328400, 227695],
    ["item-17", "Пепега-18", "Прозрачные", 983394000, 239887],
    ["item-19", "Фубар-20", "Красные", 1443819600, 245236],
  ],
};

window.onload = () => {
  const filter = FilterWidget(document.getElementById("js-filter"), demoData, [
    // 'id',
    "name",
    "category",
    "date",
    "value",
  ]);

  VisualizerWidget(
    document.getElementById("js-table-visible-columns"),
    filter.jsonStream,
    ["name", "date"]
  );

  VisualizerWidget(
    document.getElementById("js-table-all-columns"),
    filter.jsonStream
  );

  VisualizerWidget(
    document.getElementById("js-table-static"),
    BehaviorSubject(demoData)
  );
};
