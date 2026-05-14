"use client";

import { useState } from "react";

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

interface Props {
  initialConfig: ConfigItem[];
}

export default function AdminSettingsClient({ initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setSaving(key);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (res.ok) {
        setConfig((prev) =>
          prev.map((c) => (c.key === key ? { ...c, value: newValue } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update config:", err);
    }

    setSaving(null);
  };

  const handleTextChange = async (key: string, newValue: string) => {
    setSaving(key);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (res.ok) {
        setConfig((prev) =>
          prev.map((c) => (c.key === key ? { ...c, value: newValue } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update config:", err);
    }

    setSaving(null);
  };

  return (
    <div
      data-testid="admin-settings"
      className="h-full overflow-y-auto px-4 pb-20"
      style={{ paddingTop: "max(48px, calc(env(safe-area-inset-top, 0px) + 16px))" }}
    >
      <h1 data-testid="settings-title" className="text-white text-xl font-bold mb-6">
        App Settings
      </h1>

      <div className="space-y-4">
        {config.map((item) => {
          const isBool = item.value === "true" || item.value === "false";

          return (
            <div
              key={item.key}
              data-testid="config-item"
              className="bg-gray-900 border border-gray-800 rounded-xl p-4
                         overflow-hidden"
            >
              {/* Stack vertically on mobile, horizontal on desktop */}
              <div className="flex flex-col gap-3">
                {/* Label + Description */}
                <div className="min-w-0">
                  <p
                    data-testid="config-key"
                    className="text-white font-semibold text-sm break-all"
                    style={{ overflowWrap: "break-word", wordBreak: "break-all" }}
                  >
                    {item.key}
                  </p>
                  {item.description && (
                    <p
                      data-testid="config-description"
                      className="text-gray-500 text-xs mt-1"
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Control */}
                <div className="flex-shrink-0">
                  {isBool ? (
                    <label
                      data-testid="config-toggle"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.value === "true"}
                        onChange={() => handleToggle(item.key, item.value)}
                        disabled={saving === item.key}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 bg-gray-700 rounded-full
                 peer-checked:bg-blue-600
                 peer-disabled:opacity-50
                 after:content-['']
                 after:absolute
                 after:top-[2px]
                 after:start-[2px]
                 after:bg-white
                 after:rounded-full
                 after:h-5
                 after:w-5
                 after:transition-all
                 peer-checked:after:translate-x-full"
                      />
                    </label>
                  ) : (
                    <input
                      data-testid="config-text-input"
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        setConfig((prev) =>
                          prev.map((c) =>
                            c.key === item.key ? { ...c, value: e.target.value } : c
                          )
                        );
                      }}
                      onBlur={(e) => handleTextChange(item.key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700
                                 rounded-lg text-white text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 overflow-hidden text-ellipsis"
                      style={{
                        overflowWrap: "break-word",
                        wordBreak: "break-all",
                      }}
                    />
                  )}
                </div>
              </div>

              {saving === item.key && (
                <p className="text-blue-400 text-xs mt-2">Saving...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
