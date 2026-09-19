import { App, Modal, Notice } from "obsidian";

type Question = {
  type: "multiple_choice" | "fill_in_blank";
  question: string;
  options?: { A: string; B: string; C: string; D: string };
  correct: string;
};

export class QuizModal extends Modal {
  questions: Question[];
  current = 0;
  answers: string[] = [];

  constructor(app: App, questions: Question[]) {
    super(app);
    this.questions = questions;
  }

  onOpen() {
    this.renderQuestion();
  }

  renderQuestion() {
    const { contentEl } = this;
    contentEl.empty();

    const q = this.questions[this.current];

    contentEl.createEl("p", {
      text: `Question ${this.current + 1} of ${this.questions.length}`,
      cls: "quizdian-progress",
    });

    contentEl.createEl("h3", { text: q.question });

    let selected = "";

    if (q.type === "multiple_choice") {
      const optionsEl = contentEl.createDiv({ cls: "quizdian-options" });

      Object.entries(q.options!).forEach(([key, value]) => {
        const btn = optionsEl.createEl("button", {
          text: `${key}. ${value}`,
          cls: "quizdian-option-btn",
        });
        btn.onclick = () => {
          selected = key;
          optionsEl.querySelectorAll("button").forEach((b) => b.removeClass("selected"));
          btn.addClass("selected");
        };
      });
    } else {
      const input = contentEl.createEl("input", {
        type: "text",
        placeholder: "Type your answer",
        cls: "quizdian-fill-input",
      });
      input.oninput = () => {
        selected = input.value;
      };
    }

    const nextBtn = contentEl.createEl("button", {
      text: this.current + 1 === this.questions.length ? "Finish" : "Next",
      cls: "quizdian-next-btn",
    });

    nextBtn.onclick = () => {
      if (!selected) {
        new Notice("Please answer before continuing.");
        return;
      }

      this.answers.push(selected);

      if (this.current + 1 < this.questions.length) {
        this.current++;
        this.renderQuestion();
      } else {
        this.showScore();
      }
    };
  }

  showScore() {
    const { contentEl } = this;
    contentEl.empty();

    const correctCount = this.questions.filter(
      (q, i) => q.correct.trim().toLowerCase() === this.answers[i].trim().toLowerCase()
    ).length;

    contentEl.createEl("h2", { text: "Quiz complete" });
    contentEl.createEl("p", {
      text: `${correctCount} / ${this.questions.length} correct`,
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}