import { App, Modal } from "obsidian";

export class GeneratingModal extends Modal {
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("quizdian-generating");

    contentEl.createEl("div", { cls: "quizdian-spinner" });
    contentEl.createEl("p", { text: "Generating your quiz..." });
  }

  onClose() {
    this.contentEl.empty();
  }
}