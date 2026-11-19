import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsScreen } from "@/components/pocketmind/SettingsScreen";
import { LocaleProvider } from "@/lib/i18n";
import { defaultPreferences } from "@/lib/preferences";

describe("SettingsScreen", () => {
  it("saves explicit language, processing, and voice preferences", () => {
    const onSave = vi.fn();
    render(
      <LocaleProvider>
        <SettingsScreen
          preferences={defaultPreferences("local")}
          documentCount={2}
          evidenceCount={1}
          storageBytes={1024}
          storageError=""
          onSave={onSave}
          onClearWorkspace={vi.fn()}
        />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByLabelText("Interface language"), {
      target: { value: "pt" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Cloud AI" }));
    fireEvent.click(screen.getByRole("switch", { name: /Voice input in Q&A/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "pt",
        defaultProcessingMode: "cloud",
        voiceInputEnabled: false,
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Settings saved.");
  });

  it("requires explicit confirmation before deleting local workspace data", async () => {
    const onClearWorkspace = vi.fn().mockResolvedValue(undefined);
    render(
      <LocaleProvider>
        <SettingsScreen
          preferences={defaultPreferences("local")}
          documentCount={1}
          evidenceCount={0}
          storageBytes={1024}
          storageError=""
          onSave={vi.fn()}
          onClearWorkspace={onClearWorkspace}
        />
      </LocaleProvider>,
    );

    const deleteButton = screen.getByRole("button", { name: "Delete local data" });
    expect(deleteButton).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(
        "I understand that this permanently deletes the local workspace data in this browser.",
      ),
    );
    fireEvent.click(deleteButton);

    expect(onClearWorkspace).toHaveBeenCalledTimes(1);
  });
});
