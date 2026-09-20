import { Plugin, Notice, MarkdownView } from "obsidian";
import { QuizView, VIEW_TYPE_QUIZ } from "./QuizView";
import { HomeView, VIEW_TYPE_HOME } from "./HomeView";
import { GenerateOptionsModal } from "./GenerateOptionsModal";
import { QuizdianSettingTab, QuizdianSettings, DEFAULT_SETTINGS } from "./settings";

export type HistoryEntry = {
  code: string;
  title: string;
  count: number;
  timestamp: number;
  type: "generated" | "joined";
  questions: any[];
  score?: { correct: number; total: number };
  completedAt?: number;
};

interface QuizdianData {
  history: HistoryEntry[];
  settings: QuizdianSettings;
}

const DEFAULT_DATA: QuizdianData = {
  history: [],
  settings: DEFAULT_SETTINGS,
};

export default class QuizdianPlugin extends Plugin {
  data: QuizdianData = DEFAULT_DATA;

  get settings(): QuizdianSettings {
    return this.data.settings;
  }

  async onload() {
    const loaded = await this.loadData();
    this.data = Object.assign({}, DEFAULT_DATA, loaded);
    this.data.settings = Object.assign({}, DEFAULT_SETTINGS, loaded?.settings);

    this.addSettingTab(new QuizdianSettingTab(this.app, this));

    this.registerView(VIEW_TYPE_QUIZ, (leaf) => new QuizView(leaf, this));
    this.registerView(VIEW_TYPE_HOME, (leaf) => new HomeView(leaf, this));

    this.addRibbonIcon("help-circle", "Quizdian", () => {
      this.activateHomeView();
    });

    this.addCommand({
      id: "generate-quiz-from-note",
      name: "Generate quiz from this note",
      callback: async () => {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView) {
          new Notice("Quizdian: open a note first.");
          return;
        }

        const content = activeView.editor.getValue();
        const suggestedTitle = activeView.file?.basename ?? "";
        new GenerateOptionsModal(this.app, this, content, suggestedTitle).open();
      },
    });
  }

  async saveSettings() {
    await this.saveData(this.data);
  }

  async addHistoryEntry(entry: HistoryEntry) {
    this.data.history = this.data.history.filter((h) => h.code !== entry.code);
    this.data.history.unshift(entry);
    this.data.history = this.data.history.slice(0, 30);
    await this.saveData(this.data);
  }

  async updateHistoryScore(code: string, correct: number, total: number) {
    const entry = this.data.history.find((h) => h.code === code);
    if (!entry) return;

    entry.score = { correct, total };
    entry.completedAt = Date.now();
    await this.saveData(this.data);
  }

  async activateHomeView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_HOME)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_HOME, active: true });
    }
    workspace.revealLeaf(leaf);
    (leaf.view as HomeView).render();
  }

  async clearHistory() {
    this.data.history = [];
    await this.saveData(this.data);
  }

  onunload() {}
}