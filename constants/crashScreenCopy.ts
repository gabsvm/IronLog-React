// S7: crash-screen copy lives OUTSIDE the lazy dictionaries so the error
// boundary can render even when a language chunk failed to load.
export const CRASH_SCREEN_COPY = {
    en: {
        criticalError: 'CRITICAL ERROR',
        theApplicationFailedTo: 'The application failed to initialize properly.',
        resetLocalData: 'Reset Local Data',
        resettingLocalDataWill: 'Resetting local data will clear cached sessions and offline state. This action is permanent and cannot be undone.',
        resetting: 'Resetting...',
        confirmReset: 'Confirm Reset',
        cancel: 'Cancel',
        reloadApp: 'Reload App',
        exporting: 'Exporting...',
        exportBackup: 'Export Backup',
        viewTechnicalErrorDetails: 'View technical error details',
        backupSaved: "Backup saved: {file}",
    },
    es: {
        criticalError: 'ERROR CRÍTICO',
        theApplicationFailedTo: 'La aplicación no pudo inicializarse correctamente.',
        resetLocalData: 'Reiniciar datos locales',
        resettingLocalDataWill: 'Esto borrará las sesiones en caché y el estado offline. Esta acción es permanente y no se puede deshacer.',
        resetting: 'Reiniciando...',
        confirmReset: 'Confirmar reinicio',
        cancel: 'Cancelar',
        reloadApp: 'Recargar aplicación',
        exporting: 'Exportando...',
        exportBackup: 'Exportar copia de seguridad',
        viewTechnicalErrorDetails: 'Ver detalles técnicos del error',
        backupSaved: "Copia guardada: {file}",
    },
};
