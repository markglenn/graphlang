interface DataTableProps {
  data: Array<{ id: string; [key: string]: unknown }>;
  columns: Array<{ field: string; label: string; sortable?: boolean }>;
  page_size?: number;
}

type EmitFn = (event: string, payload: unknown) => void;

export function mount_data_table(
  element: HTMLElement,
  props: DataTableProps,
  emit: EmitFn,
): void {
  render(element, props, emit);
}

export function update_data_table(
  element: HTMLElement,
  props: DataTableProps,
): void {
  element.innerHTML = "";
  render(element, props, () => {});
}

export function unmount_data_table(element: HTMLElement): void {
  element.innerHTML = "";
}

function render(
  element: HTMLElement,
  props: DataTableProps,
  emit: EmitFn,
): void {
  const table = document.createElement("table");
  table.setAttribute("data-gl-component", "data_table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const col of props.columns) {
    const th = document.createElement("th");
    th.textContent = col.label;
    if (col.sortable !== false) {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        emit("on_sort", { field: col.field, direction: "asc" });
      });
    }
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const pageSize = props.page_size ?? 25;
  const rows = props.data.slice(0, pageSize);
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.addEventListener("click", () => {
      emit("on_row_click", { id: row.id });
    });
    for (const col of props.columns) {
      const td = document.createElement("td");
      td.textContent = String(row[col.field] ?? "");
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  element.appendChild(table);
}
