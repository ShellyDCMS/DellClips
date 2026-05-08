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
    <div data-testid="admin-settings" className="h-full overflow-y-auto px-4 pt-12 pb-20">
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
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p
                    data-testid="config-key"
                    className="text-white font-semibold text-sm"
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

                {isBool ? (
                  <button
                    data-testid="config-toggle"
                    onClick={() => handleToggle(item.key, item.value)}
                    disabled={saving === item.key}
                    className={`relative w-12 h-6 rounded-full transition-colors
                               disabled:opacity-50 ${
                                 item.value === "true" ? "bg-blue-600" : "bg-gray-700"
                               }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full
                                  transition-transform ${
                                    item.value === "true"
                                      ? "translate-x-6"
                                      : "translate-x-0.5"
                                  }`}
                    />
                  </button>
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
                    className="w-48 px-3 py-1 bg-gray-800 border border-gray-700
                               rounded-lg text-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {saving === item.key && (
                <p data-testid="config-saving" className="text-blue-400 text-xs mt-2">
                  Saving...
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
