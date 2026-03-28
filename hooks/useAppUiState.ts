import { useState } from 'react';

export const useAppUiState = () => {
  const [displayUnit, setDisplayUnit] = useState<'money' | 'unit'>('money');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  return {
    displayUnit,
    setDisplayUnit,
    showServerConfig,
    openServerConfig: () => setShowServerConfig(true),
    closeServerConfig: () => setShowServerConfig(false),
    showAdvancedSettings,
    toggleAdvancedSettings: () => setShowAdvancedSettings((current) => !current),
  };
};
