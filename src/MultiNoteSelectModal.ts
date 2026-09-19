import { App, Modal, TFile } from "obsidian";
import { GenerateOptionsModal } from "./GenerateOptionsModal";
import type QuizdianPlugin from "./main";

export class MultiNoteSelectModal extends Modal {
  plugin: QuizdianPlugin;
  selected: Set<TFile> = new Set();
  allFiles: TFile[];
  listEl!: HTMLElement;

  constructor(app: App, plugin: QuizdianPlugin) {
    super(app);
    this.plugin = plugin;
    this.allFiles = this.app.vault.getMarkdownFiles();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("quizdian-note-select");

    contentEl.createEl("h3", { text: "Select notes" });

    const searchInput = contentEl.createEl("input", {
      type: "text",
      placeholder: "Filter notes...",
      cls: "quizdian-fill-input",
    });

    this.listEl = contentEl.createDiv({ cls: "quizdian-note-list" });
    this.renderList(this.allFiles);

    searchInput.oninput = () => {
      const query = searchInput.value.toLowerCase();
      const filtered = this.allFiles.filter((f) =>
        f.basename.toLowerCase().includes(query)
      );
      this.renderList(filtered);
    };

    const continueBtn = contentEl.createEl("button", {
      text: "Continue",
      cls: "quizdian-next-btn",
    });

    continueBtn.onclick = async () => {
      if (this.selected.size === 0) return;

      const files = Array.from(this.selected);
      const contents = await Promise.all(files.map((f) => this.app.vault.read(f)));
      const combined = contents.join("\n\n---\n\n");

      const suggestedTitle =
        files.length === 1
          ? files[0].basename
          : files
              .map((f) => f.basename)
              .slice(0, 2)
              .join(" + ") + (files.length > 2 ? ` +${files.length - 2} more` : "");

      this.close();
      new GenerateOptionsModal(this.app, this.plugin, combined, suggestedTitle).open();
    };
  }

  renderList(files: TFile[]) {
    this.listEl.empty();

    files.forEach((file) => {
      const row = this.listEl.createDiv({ cls: "quizdian-note-row" });

      const checkbox = row.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selected.has(file);
      checkbox.onchange = () => {
        if (checkbox.checked) {
          this.selected.add(file);
        } else {
          this.selected.delete(file);
        }
      };

      row.createEl("span", { text: file.basename });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}