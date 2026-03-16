// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme, false); // false = don't save again
}

async function setTheme(theme, save = true) {
    console.log('🎨 Cambio tema a:', theme);
    
    // Remove existing theme attribute
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        // Light theme is default, no attribute needed
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Force reflow to ensure CSS variables are updated
    void document.documentElement.offsetHeight;
    
    // Update button states
    if (elements.themeLight) {
        if (theme === 'light') {
            elements.themeLight.classList.add('active');
        } else {
            elements.themeLight.classList.remove('active');
        }
    }
    if (elements.themeDark) {
        if (theme === 'dark') {
            elements.themeDark.classList.add('active');
        } else {
            elements.themeDark.classList.remove('active');
        }
    }
    
    // Save to localStorage
    if (save) {
        localStorage.setItem('theme', theme);
        console.log('✅ Tema salvato in localStorage:', theme);
        
        // Save to Supabase if user is logged in
        if (AppState.isLoggedIn && AppState.currentUser) {
            const supabase = getSupabaseClient();
            
            if (supabase) {
                try {
                    const temaScuro = theme === 'dark';
                    // Aggiorna il tema dell'utente
                    const { error } = await supabase
                        .from('utenti')
                        .update({ tema_scuro: temaScuro })
                        .eq('uid', AppState.currentUser.uid);
                    
                    if (error) throw error;
                    console.log('✅ Tema salvato in Supabase:', temaScuro);
                    await sendAppEventBroadcast({ table: 'utenti', action: 'update', uid: AppState.currentUser.uid });
                } catch (error) {
                    console.error('❌ Errore nel salvataggio tema in Supabase:', error);
                }
            }
        }
    }
}
