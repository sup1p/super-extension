export interface Translations {
    [key: string]: {
        en: string;
        ru: string;
        es: string;
    };
}

export const translations: Translations = {
    // Home screen
    'megan_intro': {
        en: "Hello! I'm your AI assistant — Megan, here to help you work smarter and faster.",
        ru: "Привет! Я ваш ИИ-ассистент — Меган, здесь чтобы помочь вам работать умнее и быстрее.",
        es: "¡Hola! Soy tu asistente de IA — Megan, aquí para ayudarte a trabajar más inteligente y rápido."
    },
    'megan_capabilities': {
        en: "I can summarize, rewrite, translate, generate content and assist with research 24/7.",
        ru: "Я могу резюмировать, переписывать, переводить, генерировать контент и помогать с исследованиями 24/7.",
        es: "Puedo resumir, reescribir, traducir, generar contenido y ayudar con investigaciones 24/7."
    },
    'lets_get_started': {
        en: "Let's get things done!",
        ru: "Давайте начнем работу!",
        es: "¡Hagamos las cosas!"
    },

    'limit_exceeded': {
        en: "Your limit to voice assistant is exceeded",
        ru: "Ваш лимит на голосового ассистента превышен",
        es: "Se ha excedido el límite de tu asistente de voz",
    },

    // Navigation
    'notes': {
        en: "Notes",
        ru: "Заметки",
        es: "Notas"
    },
    'chat': {
        en: "Chat",
        ru: "Чат",
        es: "Chat"
    },
    'voice': {
        en: "Voice",
        ru: "Голос",
        es: "Voz"
    },
    'translate': {
        en: "Translate",
        ru: "Перевод",
        es: "Traducir"
    },
    'tools': {
        en: "Tools",
        ru: "Инструменты",
        es: "Herramientas"
    },
    'settings': {
        en: "Settings",
        ru: "Настройки",
        es: "Configuración"
    },

    // Notes
    'note_placeholder': {
        en: "What do you want to save?",
        ru: "Что вы хотите сохранить?",
        es: "¿Qué quieres guardar?"
    },
    'save': {
        en: "Save",
        ru: "Сохранить",
        es: "Guardar"
    },
    'search': {
        en: "Search",
        ru: "Поиск",
        es: "Buscar"
    },
    'back': {
        en: "← Back",
        ru: "← Назад",
        es: "← Atrás"
    },
    'delete': {
        en: "Delete",
        ru: "Удалить",
        es: "Eliminar"
    },
    'title': {
        en: "Title",
        ru: "Заголовок",
        es: "Título"
    },
    'delete_note_confirm': {
        en: "Delete note?",
        ru: "Удалить заметку?",
        es: "¿Eliminar nota?"
    },
    'delete_note_message': {
        en: "Are you sure you want to delete this note? This action cannot be undone.",
        ru: "Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.",
        es: "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
    },
    'cancel': {
        en: "Cancel",
        ru: "Отмена",
        es: "Cancelar"
    },
    'calendar': {
        en: "Calendar",
        ru: "Календарь",
        es: "Calendario"
    },

    // Chat
    'chat_placeholder': {
        en: "Ask whatever you want...",
        ru: "Спрашивайте что угодно...",
        es: "Pregunta lo que quieras..."
    },
    'send': {
        en: "Send",
        ru: "Отправить",
        es: "Enviar"
    },
    'chat_history': {
        en: "Chat History",
        ru: "История чатов",
        es: "Historial de chat"
    },
    'error_loading_chat_history': {
        en: "Error loading chat history.",
        ru: "Ошибка загрузки истории чатов.",
        es: "Error al cargar el historial de chat."
    },
    'no_chats': {
        en: "No chats.",
        ru: "Нет чатов.",
        es: "No hay chats."
    },
    'delete_chat': {
        en: "Delete chat",
        ru: "Удалить чат",
        es: "Eliminar chat"
    },
    'delete_chat_confirm': {
        en: "Delete chat?",
        ru: "Удалить чат?",
        es: "¿Eliminar chat?"
    },
    'delete_chat_message': {
        en: "Are you sure you want to delete this chat? This action cannot be undone.",
        ru: "Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.",
        es: "¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer."
    },
    'error_loading_messages': {
        en: "Error loading chat messages",
        ru: "Ошибка загрузки сообщений чата",
        es: "Error al cargar mensajes del chat"
    },
    'error_deleting_chat': {
        en: "Error deleting chat",
        ru: "Ошибка удаления чата",
        es: "Error al eliminar chat"
    },

    // Voice
    'lets_talk': {
        en: "Let's talk!",
        ru: "Давайте поговорим!",
        es: "¡Hablemos!"
    },
    'voice_waiting': {
        en: "I'm waiting to hear your pretty voice!",
        ru: "Я жду, чтобы услышать ваш прекрасный голос!",
        es: "¡Estoy esperando escuchar tu hermosa voz!"
    },
    'ready_to_listen': {
        en: "Ready to listen!",
        ru: "Готов слушать!",
        es: "¡Listo para escuchar!"
    },
    'login_required': {
        en: "Login required to save note.",
        ru: "Требуется вход для сохранения заметки.",
        es: "Se requiere iniciar sesión para guardar la nota."
    },
    'note_created': {
        en: "Note created!",
        ru: "Заметка создана!",
        es: "¡Nota creada!"
    },
    'failed_create_note': {
        en: "Failed to create note.",
        ru: "Не удалось создать заметку.",
        es: "Error al crear la nota."
    },
    'error_creating_note': {
        en: "Error creating note.",
        ru: "Ошибка создания заметки.",
        es: "Error al crear la nota."
    },
    'playing_response': {
        en: "Playing response...",
        ru: "Воспроизведение ответа...",
        es: "Reproduciendo respuesta..."
    },
    'have_something_to_say': {
        en: "I have something to say",
        ru: "У меня есть что сказать",
        es: "Tengo algo que decir"
    },
    'thinking': {
        en: "Thinking...",
        ru: "Думаю...",
        es: "Pensando..."
    },
    'microphone_denied': {
        en: "Microphone access denied.",
        ru: "Доступ к микрофону запрещен.",
        es: "Acceso al micrófono denegado."
    },
    'listening': {
        en: "Listening...",
        ru: "Слушаю...",
        es: "Escuchando..."
    },
    'error_playing_response': {
        en: "Error playing response.",
        ru: "Ошибка воспроизведения ответа.",
        es: "Error al reproducir respuesta."
    },
    'could_not_play_audio': {
        en: "Could not play audio.",
        ru: "Не удалось воспроизвести аудио.",
        es: "No se pudo reproducir el audio."
    },
    'could_not_access_microphone': {
        en: "Could not access microphone.",
        ru: "Не удалось получить доступ к микрофону.",
        es: "No se pudo acceder al micrófono."
    },

    // Translate
    'type_here': {
        en: "Type here...",
        ru: "Введите здесь...",
        es: "Escribe aquí..."
    },
    'translation_placeholder': {
        en: "Translation will appear here...",
        ru: "Перевод появится здесь...",
        es: "La traducción aparecerá aquí..."
    },

    // Tools
    'all_tools': {
        en: "All tools",
        ru: "Все инструменты",
        es: "Todas las herramientas"
    },
    'available_tools': {
        en: "Here is the all available tools",
        ru: "Вот все доступные инструменты",
        es: "Aquí están todas las herramientas disponibles"
    },
    'summarize': {
        en: "Summarize",
        ru: "Резюмировать",
        es: "Resumir"
    },
    'simplify': {
        en: "Simplify",
        ru: "Упростить",
        es: "Simplificar"
    },
    'soon': {
        en: "Soon",
        ru: "Скоро",
        es: "Pronto"
    },
    'hotbar_tools': {
        en: "Hotbar tools",
        ru: "Инструменты панели",
        es: "Herramientas de barra"
    },
    'hotbar_tools_desc': {
        en: "Here is tools that is in your hotbar",
        ru: "Вот инструменты, которые находятся в вашей панели",
        es: "Aquí están las herramientas que están en tu barra"
    },

    // Settings
    'appearance': {
        en: "Appearance",
        ru: "Внешний вид",
        es: "Apariencia"
    },
    'theme': {
        en: "Theme",
        ru: "Тема",
        es: "Tema"
    },
    'system': {
        en: "System",
        ru: "Системная",
        es: "Sistema"
    },
    'light': {
        en: "Light",
        ru: "Светлая",
        es: "Claro"
    },
    'dark': {
        en: "Dark",
        ru: "Темная",
        es: "Oscuro"
    },
    'language': {
        en: "Language",
        ru: "Язык",
        es: "Idioma"
    },
    'english': { en: 'English', ru: 'Английский', es: 'Inglés' },
    'chinese': { en: 'Chinese', ru: 'Китайский', es: 'Chino' },
    'hindi': { en: 'Hindi', ru: 'Хинди', es: 'Hindi' },
    'spanish': { en: 'Spanish', ru: 'Испанский', es: 'Español' },
    'french': { en: 'French', ru: 'Французский', es: 'Francés' },
    'arabic': { en: 'Arabic', ru: 'Арабский', es: 'Árabe' },
    'bengali': { en: 'Bengali', ru: 'Бенгальский', es: 'Bengalí' },
    'russian': { en: 'Russian', ru: 'Русский', es: 'Ruso' },
    'portuguese': { en: 'Portuguese', ru: 'Португальский', es: 'Portugués' },
    'urdu': { en: 'Urdu', ru: 'Урду', es: 'Urdu' },
    'indonesian': { en: 'Indonesian', ru: 'Индонезийский', es: 'Indonesio' },
    'german': { en: 'German', ru: 'Немецкий', es: 'Alemán' },
    'japanese': { en: 'Japanese', ru: 'Японский', es: 'Japonés' },
    'swahili': { en: 'Swahili', ru: 'Суахили', es: 'Swahili' },
    'marathi': { en: 'Marathi', ru: 'Маратхи', es: 'Maratí' },
    'telugu': { en: 'Telugu', ru: 'Телугу', es: 'Telugu' },
    'turkish': { en: 'Turkish', ru: 'Турецкий', es: 'Turco' },
    'tamil': { en: 'Tamil', ru: 'Тамильский', es: 'Tamil' },
    'vietnamese': { en: 'Vietnamese', ru: 'Вьетнамский', es: 'Vietnamita' },
    'korean': { en: 'Korean', ru: 'Корейский', es: 'Coreano' },
    'persian': { en: 'Persian', ru: 'Персидский', es: 'Persa' },
    'italian': { en: 'Italian', ru: 'Итальянский', es: 'Italiano' },
    'polish': { en: 'Polish', ru: 'Польский', es: 'Polaco' },
    'ukrainian': { en: 'Ukrainian', ru: 'Украинский', es: 'Ucraniano' },
    'romanian': { en: 'Romanian', ru: 'Румынский', es: 'Rumano' },
    'dutch': { en: 'Dutch', ru: 'Голландский', es: 'Neerlandés' },
    'thai': { en: 'Thai', ru: 'Тайский', es: 'Tailandés' },
    'gujarati': { en: 'Gujarati', ru: 'Гуджарати', es: 'Guyaratí' },
    'punjabi': { en: 'Punjabi', ru: 'Пенджабский', es: 'Panyabí' },
    'malayalam': { en: 'Malayalam', ru: 'Малаялам', es: 'Malayalam' },
    'kannada': { en: 'Kannada', ru: 'Каннада', es: 'Canarés' },
    'javanese': { en: 'Javanese', ru: 'Яванский', es: 'Javanés' },
    'burmese': { en: 'Burmese', ru: 'Бирманский', es: 'Birmano' },
    'greek': { en: 'Greek', ru: 'Греческий', es: 'Griego' },
    'hungarian': { en: 'Hungarian', ru: 'Венгерский', es: 'Húngaro' },
    'czech': { en: 'Czech', ru: 'Чешский', es: 'Checo' },
    'swedish': { en: 'Swedish', ru: 'Шведский', es: 'Sueco' },
    'finnish': { en: 'Finnish', ru: 'Финский', es: 'Finés' },
    'norwegian': { en: 'Norwegian', ru: 'Норвежский', es: 'Noruego' },
    'danish': { en: 'Danish', ru: 'Датский', es: 'Danés' },
    'hebrew': { en: 'Hebrew', ru: 'Иврит', es: 'Hebreo' },
    'serbian': { en: 'Serbian', ru: 'Сербский', es: 'Serbio' },
    'slovak': { en: 'Slovak', ru: 'Словацкий', es: 'Eslovaco' },
    'bulgarian': { en: 'Bulgarian', ru: 'Болгарский', es: 'Búlgaro' },
    'croatian': { en: 'Croatian', ru: 'Хорватский', es: 'Croata' },
    'lithuanian': { en: 'Lithuanian', ru: 'Литовский', es: 'Lituano' },
    'slovenian': { en: 'Slovenian', ru: 'Словенский', es: 'Esloveno' },
    'estonian': { en: 'Estonian', ru: 'Эстонский', es: 'Estonio' },
    'latvian': { en: 'Latvian', ru: 'Латышский', es: 'Letón' },
    'filipino': { en: 'Filipino', ru: 'Филиппинский', es: 'Filipino' },
    'kazakh': { en: 'Kazakh', ru: 'Казахский', es: 'Kazajo' },
    'azerbaijani': { en: 'Azerbaijani', ru: 'Азербайджанский', es: 'Azerí' },
    'uzbek': { en: 'Uzbek', ru: 'Узбекский', es: 'Uzbeko' },
    'amharic': { en: 'Amharic', ru: 'Амхарский', es: 'Amárico' },
    'nepali': { en: 'Nepali', ru: 'Непальский', es: 'Nepalí' },
    'sinhala': { en: 'Sinhala', ru: 'Сингальский', es: 'Cingalés' },
    'khmer': { en: 'Khmer', ru: 'Кхмерский', es: 'Jemer' },
    'lao': { en: 'Lao', ru: 'Лаосский', es: 'Lao' },
    'mongolian': { en: 'Mongolian', ru: 'Монгольский', es: 'Mongol' },
    'armenian': { en: 'Armenian', ru: 'Армянский', es: 'Armenio' },
    'georgian': { en: 'Georgian', ru: 'Грузинский', es: 'Georgiano' },
    'albanian': { en: 'Albanian', ru: 'Албанский', es: 'Albanés' },
    'bosnian': { en: 'Bosnian', ru: 'Боснийский', es: 'Bosnio' },
    'macedonian': { en: 'Macedonian', ru: 'Македонский', es: 'Macedonio' },
    'afrikaans': { en: 'Afrikaans', ru: 'Африкаанс', es: 'Afrikáans' },
    'zulu': { en: 'Zulu', ru: 'Зулу', es: 'Zulú' },
    'xhosa': { en: 'Xhosa', ru: 'Коса', es: 'Xhosa' },
    'sesotho': { en: 'Sesotho', ru: 'Сесото', es: 'Sesotho' },
    'yoruba': { en: 'Yoruba', ru: 'Йоруба', es: 'Yoruba' },
    'igbo': { en: 'Igbo', ru: 'Игбо', es: 'Igbo' },
    'hausa': { en: 'Hausa', ru: 'Хауса', es: 'Hausa' },
    'somali': { en: 'Somali', ru: 'Сомали', es: 'Somalí' },
    'pashto': { en: 'Pashto', ru: 'Пушту', es: 'Pastún' },
    'tajik': { en: 'Tajik', ru: 'Таджикский', es: 'Tayiko' },
    'kyrgyz': { en: 'Kyrgyz', ru: 'Киргизский', es: 'Kirguís' },
    'tatar': { en: 'Tatar', ru: 'Татарский', es: 'Tártaro' },
    'belarusian': { en: 'Belarusian', ru: 'Белорусский', es: 'Bielorruso' },
    'basque': { en: 'Basque', ru: 'Баскский', es: 'Vasco' },
    'galician': { en: 'Galician', ru: 'Галисийский', es: 'Gallego' },
    'catalan': { en: 'Catalan', ru: 'Каталонский', es: 'Catalán' },
    'icelandic': { en: 'Icelandic', ru: 'Исландский', es: 'Islandés' },
    'irish': { en: 'Irish', ru: 'Ирландский', es: 'Irlandés' },
    'maltese': { en: 'Maltese', ru: 'Мальтийский', es: 'Maltés' },
    'luxembourgish': { en: 'Luxembourgish', ru: 'Люксембургский', es: 'Luxemburgués' },
    'faroese': { en: 'Faroese', ru: 'Фарерский', es: 'Feroés' },
    'welsh': { en: 'Welsh', ru: 'Валлийский', es: 'Galés' },
    'icon': {
        en: "Icon",
        ru: "Иконка",
        es: "Icono"
    },
    'location': {
        en: "Location",
        ru: "Расположение",
        es: "Ubicación"
    },
    'bottom': {
        en: "Bottom",
        ru: "Снизу",
        es: "Abajo"
    },
    'top': {
        en: "Top",
        ru: "Сверху",
        es: "Arriba"
    },
    'hide_icon_on': {
        en: "Hide icon on",
        ru: "Скрыть иконку на",
        es: "Ocultar icono en"
    },
    'selection_tooltip': {
        en: 'Selection tooltip',
        ru: 'Тултип выделения',
        es: 'Tooltip de selección'
    },
    'hide_tooltip_on': {
        en: 'Hide tooltip on',
        ru: 'Скрывать тултип на',
        es: 'Ocultar tooltip en'
    },
    'sidebar': {
        en: "Sidebar",
        ru: "Боковая панель",
        es: "Barra lateral"
    },
    'right': {
        en: "Right",
        ru: "Справа",
        es: "Derecha"
    },
    'left': {
        en: "Left",
        ru: "Слева",
        es: "Izquierda"
    },

    // Account
    'account': {
        en: "Account",
        ru: "Аккаунт",
        es: "Cuenta"
    },
    'pro_plan': {
        en: "Pro plan",
        ru: "Pro план",
        es: "Plan Pro"
    },
    'no_pro_plan': {
        en: "You have no pro plan yet!",
        ru: "У вас пока нет pro плана!",
        es: "¡Aún no tienes un plan Pro!"
    },
    'activate': {
        en: "Activate",
        ru: "Активировать",
        es: "Activar"
    },
    'actions': {
        en: "Actions",
        ru: "Действия",
        es: "Acciones"
    },
    'logout': {
        en: "Logout",
        ru: "Выйти",
        es: "Cerrar sesión"
    },

    // Modal
    'select_language': {
        en: "Select language",
        ru: "Выберите язык",
        es: "Seleccionar idioma"
    },
    'loading': {
        en: "Loading... , please wait",
        ru: "Загрузка... , пожалуйста, подождите",
        es: "Cargando... , por favor espera"
    },
    'translate_webpage': {
        en: 'Translate Webpage •',
        ru: 'Перевести страницу •',
        es: 'Traducir página •'
    },
    // Auth modal
    'auth_required': {
        en: 'Authorization required',
        ru: 'Требуется авторизация',
        es: 'Se requiere autorización'
    },
    'auth_subtitle': {
        en: 'Sign in to your account to continue',
        ru: 'Войдите в свой аккаунт для продолжения',
        es: 'Inicia sesión en tu cuenta para continuar'
    },
    'email': {
        en: 'Email',
        ru: 'Email',
        es: 'Correo electrónico'
    },
    'password': {
        en: 'Password',
        ru: 'Пароль',
        es: 'Contraseña'
    },
    'login': {
        en: 'Sign in',
        ru: 'Войти',
        es: 'Iniciar sesión'
    },
    'logging_in': {
        en: 'Signing in...',
        ru: 'Вход...',
        es: 'Iniciando sesión...'
    },
    'register': {
        en: 'No account? Register',
        ru: 'Нет аккаунта? Зарегистрироваться',
        es: '¿No tienes cuenta? Regístrate'
    },
    'settings_main_info': {
        en: `<div style="display: flex; align-items: flex-start; gap: 18px;">
    <span style="font-size:32px; margin-top: 2px; color:var(--color-text);"></span>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <b style="color:#6F58D5;">Account</b> — manage your account, view your details, log out, or go to the Megan website.
      </div>
      <div>
        <b style="color:#6F58D5;">Appearance</b> — change the sidebar and icon position, and select a theme.
      </div>
      <div style="color:var(--color-text); font-size: 16px; margin-top: 8px;">
        Use the tabs on the left to switch between sections.
      </div>
    </div>
  </div>`,
        ru: `<div style="display: flex; align-items: flex-start; gap: 18px;">
    <span style="font-size:32px; margin-top: 2px; color:var(--color-text);"></span>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <b style="color:#6F58D5;">Аккаунт</b> — управляйте своим аккаунтом, смотрите данные, выходите или переходите на сайт Megan.
      </div>
      <div>
        <b style="color:#6F58D5;">Внешний вид</b> — меняйте положение сайдбара и иконки, выбирайте тему оформления.
      </div>
      <div style="color:var(--color-text); font-size: 16px; margin-top: 8px;">
        Используйте вкладки слева для перехода по разделам.
      </div>
    </div>
  </div>`,
        es: `<div style="display: flex; align-items: flex-start; gap: 18px;">
    <span style="font-size:32px; margin-top: 2px; color:var(--color-text);"></span>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <b style="color:#6F58D5;">Cuenta</b> — gestiona tu cuenta, consulta tus datos, cierra sesión o visita el sitio de Megan.
      </div>
      <div>
        <b style="color:#6F58D5;">Apariencia</b> — cambia la posición de la barra lateral y el icono, y elige el tema.
      </div>
      <div style="color:var(--color-text); font-size: 16px; margin-top: 8px;">
        Usa las pestañas a la izquierda para cambiar de sección.
      </div>
    </div>
  </div>`
    },
    // --- Popup UI ---
    'translate_text': {
        en: 'Translate text',
        ru: 'Перевести текст',
        es: 'Traducir texto'
    },
    'summarize_text': {
        en: 'Summarize text',
        ru: 'Суммировать текст',
        es: 'Resumir texto'
    },
    'voice_playback': {
        en: 'Voice playback',
        ru: 'Воспроизведение голоса',
        es: 'Reproducción de voz'
    },
    'chat_with_megan': {
        en: 'Chat with Megan',
        ru: 'Чат с Меган',
        es: 'Chat con Megan'
    },
    'summary_placeholder': {
        en: 'Summary will appear here...',
        ru: 'Здесь появится краткое содержание...',
        es: 'El resumen aparecerá aquí...'
    },
    'login_required_translate': {
        en: 'Login required to use translate.',
        ru: 'Для перевода требуется вход.',
        es: 'Se requiere iniciar sesión para traducir.'
    },
    'login_required_summarize': {
        en: 'Login required to use summarize.',
        ru: 'Для суммирования требуется вход.',
        es: 'Se requiere iniciar sesión para resumir.'
    },
    'login_required_voice': {
        en: 'Login required to use voice.',
        ru: 'Для озвучивания требуется вход.',
        es: 'Se requiere iniciar sesión para usar voz.'
    },
    'login_required_chat': {
        en: 'Login required to use chat.',
        ru: 'Для чата требуется вход.',
        es: 'Se requiere iniciar sesión para chatear.'
    },
    'translating': {
        en: 'Translating...',
        ru: 'Перевод...',
        es: 'Traduciendo...'
    },
    'summarizing': {
        en: 'Summarizing...',
        ru: 'Суммирование...',
        es: 'Resumiendo...'
    },
    'synthesizing_voice': {
        en: 'Synthesizing voice...',
        ru: 'Синтез голоса...',
        es: 'Sintetizando voz...'
    },
    'text_synthesizing_wait': {
        en: 'Text synthesizing... Please, wait',
        ru: 'Синтез текста... Пожалуйста, подождите',
        es: 'Sintetizando texto... Por favor, espere'
    },
    'translation_error': {
        en: 'Translation error',
        ru: 'Ошибка перевода',
        es: 'Error de traducción'
    },
    'error': {
        en: 'Error',
        ru: 'Ошибка',
        es: 'Error'
    },
    'no_summary': {
        en: 'No summary.',
        ru: 'Нет краткого содержания.',
        es: 'Sin resumen.'
    },
    'could_not_synthesize_audio': {
        en: 'Could not synthesize audio.',
        ru: 'Не удалось синтезировать аудио.',
        es: 'No se pudo sintetizar el audio.'
    },
    'ai_thinking': {
        en: 'AI is thinking...',
        ru: 'ИИ думает...',
        es: 'La IA está pensando...'
    },
    'error_websocket': {
        en: 'Error: WebSocket error',
        ru: 'Ошибка: ошибка WebSocket',
        es: 'Error: error de WebSocket'
    },
    'error_ws_not_connected': {
        en: 'Error: WebSocket not connected',
        ru: 'Ошибка: WebSocket не подключен',
        es: 'Error: WebSocket no conectado'
    },
    'error_invalid_message_format': {
        en: 'Error: Invalid message format',
        ru: 'Ошибка: неверный формат сообщения',
        es: 'Error: formato de mensaje no válido'
    },
    'success_note_saved': {
        en: 'Note saved successfully!',
        ru: 'Заметка успешно сохранена!',
        es: '¡Nota guardada con éxito!'
    },
    'read_page_aloud': {
        en: 'Read page aloud',
        ru: 'Озвучить страницу',
        es: 'Leer la página en voz alta'
    },
    'read_page_aloud_warning': {
        en: 'This feature is very resource-intensive. You may spend all your tokens allocated for today. However, even if you do not have enough tokens for the full reading, you will get as much audio as your remaining tokens allow.',
        ru: 'Эта функция очень затратная, возможно вы потратите все свои токены, выделенные вам на сегодня. Однако, даже если вам не хватит токенов для полной озвучки, вы получите озвучку на столько символов, сколько у вас осталось на сегодня.',
        es: 'Esta función es muy costosa, es posible que gastes todos tus tokens asignados para hoy. Sin embargo, incluso si no tienes suficientes tokens para la lectura completa, recibirás la locución de tantos caracteres como te queden hoy.'
    },
    'dont_show_again': {
        en: "Don't show again",
        ru: "Больше не показывать",
        es: "No mostrar de nuevo"
    },
    'tokens_exhausted': {
        en: 'You have run out of tokens for today.',
        ru: 'У вас закончились токены на сегодня.',
        es: 'Te has quedado sin tokens para hoy.'
    },
    // --- Floating button close popup ---
    'close_floating_temp': {
        en: 'Just close',
        ru: 'Просто закрыть',
        es: 'Solo cerrar'
    },
    'close_floating_site': {
        en: 'Close on this site',
        ru: 'Закрыть на этом сайте',
        es: 'Cerrar en este sitio'
    },
    'close_floating_all': {
        en: 'Close everywhere',
        ru: 'Закрыть везде',
        es: 'Cerrar en todas partes'
    }
};

export type Language = 'en' | 'ru' | 'es';

export class TranslationService {
    private static currentLanguage: Language = 'en';

    public static setLanguage(language: Language, doc?: Document): void {
        this.currentLanguage = language;
        this.updateAllTranslations(doc);
    }

    public static getLanguage(): Language {
        return this.currentLanguage;
    }

    public static translate(key: string): string {
        const translation = translations[key];
        if (!translation) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }
        return translation[this.currentLanguage] || translation.en;
    }

    public static updateAllTranslations(doc?: Document): void {
        const targetDoc = doc || document;

        // Update all elements with data-translate attribute
        const elements = targetDoc.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key) {
                const translation = this.translate(key);
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    (element as HTMLInputElement | HTMLTextAreaElement).placeholder = translation;
                } else if (key === 'settings_main_info') {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update dropdown selected values
        const dropdowns = targetDoc.querySelectorAll('.custom-dropdown-selected');
        dropdowns.forEach(dropdown => {
            const key = dropdown.getAttribute('data-translate-key');
            if (key) {
                const translation = this.translate(key);
                dropdown.textContent = translation;
            }
        });
    }

    public static initializeTranslations(): void {
        // Load language from storage
        chrome.storage.local.get(['sidebarLanguage'], (result) => {
            const language = (result.sidebarLanguage as Language) || 'en';
            this.setLanguage(language);
        });
    }
} 