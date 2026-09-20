import { App, Modal, Notice } from "obsidian";
import { GeneratingModal } from "./GeneratingModal";
import { SaveQuizModal } from "./SaveQuizModal";
import type QuizdianPlugin from "./main";

export class GenerateOptionsModal extends Modal {
  plugin: QuizdianPlugin;
  content: string;
  suggestedTitle: string;

  constructor(app: App, plugin: QuizdianPlugin, content: string, suggestedTitle = "") {
    super(app);
    this.plugin = plugin;
    this.content = content;
    this.suggestedTitle = suggestedTitle;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h3", { text: "Generate quiz" });

    contentEl.createEl("label", { text: "Number of questions" });
    const input = contentEl.createEl("input", {
      type: "number",
      value: "5",
      cls: "quizdian-fill-input",
    });

    const generateBtn = contentEl.createEl("button", {
      text: "Generate",
      cls: "quizdian-next-btn",
    });

    generateBtn.onclick = async () => {
      const count = Number(input.value) || 5;
      this.close();

      const generatingModal = new GeneratingModal(this.app);
      generatingModal.open();

      try {
        const res = await fetch(`${this.plugin.settings.backendUrl}/api/generate-from-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: this.content, count }),
        });

        const data = await res.json();
        generatingModal.close();

        if (!res.ok) {
          new Notice(`Quizdian: ${data.error || "something went wrong"}`);
          return;
        }

        new SaveQuizModal(this.app, this.plugin, data.questions, this.suggestedTitle).open();
      } catch (err) {
        generatingModal.close();
        new Notice("Quizdian: couldn't reach the server.");
        console.error(err);
      }
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}