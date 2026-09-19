import { App, PluginSettingTab, Setting } from "obsidian";
import type QuizdianPlugin from "./main";

export interface QuizdianSettings {
  backendUrl: string;
}

export const DEFAULT_SETTINGS: QuizdianSettings = {
  backendUrl: "https://quizora-2ugj.vercel.app",
};

export class QuizdianSettingTab extends PluginSettingTab {
  plugin: QuizdianPlugin;

  constructor(app: App, plugin: QuizdianPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Backend URL")
      .setDesc("The Quizora server Quizdian talks to. Use https://quizora-2ugj.vercel.app during development.")
      .addText((text) =>
        text
          .setPlaceholder("https://quizora-2ugj.vercel.app")
          .setValue(this.plugin.settings.backendUrl)
          .onChange(async (value) => {
            this.plugin.settings.backendUrl = value.trim().replace(/\/$/, "");
            await this.plugin.saveSettings();
          })
      );
  }
}