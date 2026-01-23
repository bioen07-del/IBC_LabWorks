/**
 * Process Guidance System
 * Provides contextual help and step-by-step guidance for all processes
 * Based on Technical Specification (TZ)
 */

export interface ProcessStep {
  stepNumber: number
  title: string
  description: string
  requirements: string[]
  warnings?: string[]
  tips?: string[]
  requiredFields?: string[]
  ccaCriteria?: {
    parameter: string
    range: string
    critical: boolean
  }[]
}

export interface ProcessGuidance {
  processType: string
  title: string
  description: string
  sopReference?: string
  estimatedTime?: string
  requiredEquipment?: string[]
  requiredMaterials?: string[]
  steps: ProcessStep[]
  postProcessChecks?: string[]
}

// ==================== PASSAGE GUIDANCE ====================
export const passageGuidance: ProcessGuidance = {
  processType: 'passage',
  title: 'Пассирование клеток (Cell Passage)',
  description: 'Перенос клеток в новый контейнер с разведением для продолжения роста',
  sopReference: 'SOP-CULT-001',
  estimatedTime: '30-45 минут',
  requiredEquipment: ['Ламинарный бокс', 'Инкубатор CO2', 'Центрифуга', 'Микроскоп'],
  requiredMaterials: ['Среда роста', 'Trypsin-EDTA', 'PBS', 'Новые флаконы'],
  steps: [
    {
      stepNumber: 1,
      title: 'Подготовка',
      description: 'Подготовка материалов и оборудования',
      requirements: [
        'Проверьте калибровку оборудования',
        'Прогрейте среду до 37°C',
        'Подготовьте ламинарный бокс (УФ 15 мин)',
        'Проверьте наличие всех материалов'
      ],
      tips: [
        'Работайте быстро, но аккуратно',
        'Минимизируйте время вне инкубатора'
      ]
    },
    {
      stepNumber: 2,
      title: 'Извлечение контейнера',
      description: 'Достаньте контейнер из инкубатора и осмотрите под микроскопом',
      requirements: [
        'Проверьте конфлюэнтность (должно быть 70-90%)',
        'Убедитесь в отсутствии контаминации',
        'Проверьте морфологию клеток'
      ],
      warnings: [
        'При признаках контаминации немедленно остановите процесс',
        'При аномальной морфологии проконсультируйтесь с QP'
      ]
    },
    {
      stepNumber: 3,
      title: 'Снятие клеток',
      description: 'Удалите среду и обработайте клетки трипсином',
      requirements: [
        'Удалите старую среду аспирацией',
        'Промойте PBS (5 мл для T75)',
        'Добавьте трипсин (2 мл для T75)',
        'Инкубируйте 3-5 мин при 37°C',
        'Проверьте открепление под микроскопом'
      ],
      tips: [
        'Не передерживайте в трипсине',
        'Постучите по флакону для помощи открепления'
      ],
      ccaCriteria: [
        {
          parameter: 'Время трипсинизации',
          range: '3-5 минут',
          critical: false
        }
      ]
    },
    {
      stepNumber: 4,
      title: 'Нейтрализация и центрифугирование',
      description: 'Остановите действие трипсина и соберите клетки',
      requirements: [
        'Добавьте среду с сывороткой (в 2x объеме трипсина)',
        'Перенесите в центрифужную пробирку',
        'Центрифугируйте 300g, 5 минут',
        'Удалите супернатант'
      ],
      warnings: [
        'Не превышайте скорость центрифугирования',
        'Будьте осторожны при удалении супернатанта'
      ]
    },
    {
      stepNumber: 5,
      title: 'Подсчет клеток',
      description: 'Определите концентрацию и жизнеспособность клеток',
      requirements: [
        'Ресуспендируйте осадок в известном объеме среды',
        'Возьмите аликвоту для подсчета',
        'Смешайте с трипановым синим 1:1',
        'Подсчитайте в камере Горяева',
        'Запишите концентрацию и жизнеспособность'
      ],
      requiredFields: ['cell_concentration', 'viability_percent', 'dilution_factor'],
      ccaCriteria: [
        {
          parameter: 'Жизнеспособность',
          range: '≥ 85%',
          critical: true
        },
        {
          parameter: 'Концентрация',
          range: '0.5-5 × 10⁶ клеток/мл',
          critical: false
        }
      ],
      warnings: [
        'При жизнеспособности < 85% проконсультируйтесь с QP',
        'Отметьте любые необычные наблюдения'
      ]
    },
    {
      stepNumber: 6,
      title: 'Посев в новые контейнеры',
      description: 'Разведите и посейте клетки в новые контейнеры',
      requirements: [
        'Рассчитайте объем для требуемого разведения (обычно 1:3 - 1:6)',
        'Добавьте рассчитанный объем в новые флаконы',
        'Добавьте свежую среду до полного объема',
        'Аккуратно перемешайте',
        'Подпишите новые контейнеры'
      ],
      tips: [
        'Стандартное разведение для MSC: 1:4',
        'Стандартное разведение для фибробластов: 1:3',
        'Запишите точный коэффициент разведения'
      ]
    },
    {
      stepNumber: 7,
      title: 'Инкубация',
      description: 'Поместите контейнеры в инкубатор',
      requirements: [
        'Поместите в инкубатор 37°C, 5% CO2',
        'Равномерно распределите среду',
        'Проверьте настройки инкубатора',
        'Зарегистрируйте локацию'
      ],
      warnings: [
        'Не открывайте инкубатор часто',
        'Проверьте уровень CO2'
      ]
    }
  ],
  postProcessChecks: [
    'Все данные внесены в систему',
    'Новые контейнеры промаркированы',
    'Старые контейнеры утилизированы',
    'Рабочая зона продезинфицирована',
    'Оборудование выключено'
  ]
}

// ==================== THAWING GUIDANCE ====================
export const thawingGuidance: ProcessGuidance = {
  processType: 'thawing',
  title: 'Размораживание клеток (Cell Thawing)',
  description: 'Восстановление жизнеспособности замороженных клеток',
  sopReference: 'SOP-CULT-003',
  estimatedTime: '20-30 минут',
  requiredEquipment: ['Ламинарный бокс', 'Водяная баня 37°C', 'Центрифуга', 'Инкубатор CO2'],
  requiredMaterials: ['Среда роста (предварительно прогретая)', 'PBS', 'Новый флакон'],
  steps: [
    {
      stepNumber: 1,
      title: 'Подготовка',
      description: 'Подготовка материалов перед размораживанием',
      requirements: [
        'Прогрейте среду до 37°C',
        'Подготовьте водяную баню 37°C',
        'Подготовьте ламинарный бокс',
        'Приготовьте новый контейнер с 10 мл среды'
      ],
      warnings: [
        'Работайте быстро - DMSO токсичен при комнатной температуре',
        'Не перегревайте криовиалу'
      ]
    },
    {
      stepNumber: 2,
      title: 'Извлечение и размораживание',
      description: 'Достаньте криовиалу и быстро разморозьте',
      requirements: [
        'Извлеките криовиалу из хранилища',
        'Немедленно поместите в водяную баню 37°C',
        'Размораживайте быстро (1-2 минуты)',
        'Следите, чтобы осталось небольшое количество льда',
        'Сразу перенесите в ламинарный бокс'
      ],
      tips: [
        'Держите криовиалу под водой, но не погружайте крышку',
        'Покачивайте для ускорения размораживания'
      ],
      ccaCriteria: [
        {
          parameter: 'Время размораживания',
          range: '1-2 минуты',
          critical: true
        }
      ]
    },
    {
      stepNumber: 3,
      title: 'Перенос клеток',
      description: 'Разведите клетки и удалите DMSO',
      requirements: [
        'Медленно добавьте 1 мл теплой среды к криовиале',
        'Перенесите содержимое в центрифужную пробирку',
        'Медленно (по капле) добавьте 9 мл среды',
        'Осторожно перемешайте',
        'Центрифугируйте 300g, 5 минут'
      ],
      warnings: [
        'Добавляйте среду медленно - резкое изменение осмолярности вредно',
        'Не оставляйте клетки с DMSO надолго'
      ]
    },
    {
      stepNumber: 4,
      title: 'Промывка и подсчет',
      description: 'Удалите супернатант и подсчитайте клетки',
      requirements: [
        'Удалите супернатант',
        'Ресуспендируйте в 5 мл свежей среды',
        'Возьмите аликвоту для подсчета',
        'Подсчитайте с трипановым синим',
        'Запишите концентрацию и жизнеспособность'
      ],
      requiredFields: ['cell_concentration', 'viability_percent', 'total_cells'],
      ccaCriteria: [
        {
          parameter: 'Жизнеспособность после разморозки',
          range: '≥ 70%',
          critical: true
        }
      ],
      warnings: [
        'При жизнеспособности < 70% уведомите QP',
        'Запишите время от разморозки до посева'
      ]
    },
    {
      stepNumber: 5,
      title: 'Посев',
      description: 'Посейте клетки в культуральный контейнер',
      requirements: [
        'Рассчитайте объем для требуемой плотности посева',
        'Перенесите в подготовленный флакон',
        'Добавьте среду до полного объема',
        'Аккуратно перемешайте',
        'Промаркируйте контейнер'
      ],
      tips: [
        'Рекомендуемая плотность: 5,000-10,000 клеток/см²',
        'Используйте высокую плотность после разморозки'
      ]
    },
    {
      stepNumber: 6,
      title: 'Инкубация и мониторинг',
      description: 'Поместите в инкубатор и проверьте прикрепление',
      requirements: [
        'Поместите в инкубатор 37°C, 5% CO2',
        'Проверьте через 24 часа прикрепление',
        'Смените среду через 24-48 часов',
        'Удалите неприкрепленные клетки'
      ],
      tips: [
        'Не тревожьте клетки первые 4-6 часов',
        'Первая смена среды критична для удаления остатков DMSO'
      ]
    }
  ],
  postProcessChecks: [
    'Криовиала отмечена как использованная',
    'Новый контейнер зарегистрирован',
    'Данные подсчета внесены',
    'Запланирована смена среды через 24ч',
    'Рабочая зона продезинфицирована'
  ]
}

// ==================== FREEZING GUIDANCE ====================
export const freezingGuidance: ProcessGuidance = {
  processType: 'freezing',
  title: 'Замораживание клеток (Cell Freezing)',
  description: 'Криоконсервация клеток для длительного хранения',
  sopReference: 'SOP-CULT-004',
  estimatedTime: '40-60 минут',
  requiredEquipment: ['Ламинарный бокс', 'Центрифуга', 'Микроскоп', 'Freezing container', 'Морозильник -80°C'],
  requiredMaterials: ['Freezing medium', 'Trypsin-EDTA', 'PBS', 'Криовиалы'],
  steps: [
    {
      stepNumber: 1,
      title: 'Подготовка',
      description: 'Подготовка freezing medium и материалов',
      requirements: [
        'Приготовьте freezing medium (FBS + 10% DMSO)',
        'Охладите freezing medium до 4°C',
        'Подготовьте криовиалы с этикетками',
        'Подготовьте freezing container (изопропанол)',
        'Убедитесь, что клетки готовы (70-90% confluency)'
      ],
      warnings: [
        'DMSO токсичен - работайте в вытяжке',
        'Freezing medium должен быть холодным',
        'Не используйте старый DMSO (> 1 года)'
      ],
      tips: [
        'Замораживайте только здоровые, активно растущие культуры',
        'Оптимальное время после пассажа: 48-72 часа'
      ]
    },
    {
      stepNumber: 2,
      title: 'Сбор клеток',
      description: 'Снимите и соберите клетки как при пассаже',
      requirements: [
        'Выполните трипсинизацию (см. процесс пассажа)',
        'Нейтрализуйте трипсин',
        'Центрифугируйте 300g, 5 минут',
        'Удалите супернатант полностью'
      ],
      warnings: [
        'Избегайте остатков среды с трипсином',
        'Работайте быстро после центрифугирования'
      ]
    },
    {
      stepNumber: 3,
      title: 'Подсчет клеток',
      description: 'Определите концентрацию для расчета объема',
      requirements: [
        'Ресуспендируйте в небольшом объеме холодной среды',
        'Подсчитайте клетки',
        'Проверьте жизнеспособность'
      ],
      requiredFields: ['cell_concentration', 'viability_percent', 'total_cells'],
      ccaCriteria: [
        {
          parameter: 'Жизнеспособность перед заморозкой',
          range: '≥ 90%',
          critical: true
        },
        {
          parameter: 'Концентрация для заморозки',
          range: '1-5 × 10⁶ клеток/виала',
          critical: false
        }
      ],
      warnings: [
        'Не замораживайте клетки с жизнеспособностью < 90%',
        'Плохая жизнеспособность перед заморозкой = плохая после разморозки'
      ]
    },
    {
      stepNumber: 4,
      title: 'Ресуспендирование в freezing medium',
      description: 'Разведите клетки в холодном freezing medium',
      requirements: [
        'Рассчитайте объем для 1-5×10⁶ клеток/мл',
        'Медленно добавьте холодный freezing medium к осадку',
        'Аккуратно перемешайте',
        'Работайте на льду или в холодной зоне'
      ],
      warnings: [
        'Не оставляйте клетки в DMSO при комнатной температуре',
        'Работайте максимально быстро'
      ],
      tips: [
        'Стандартная концентрация: 2-3×10⁶ клеток/мл',
        'Объем на виалу: 1-2 мл'
      ]
    },
    {
      stepNumber: 5,
      title: 'Распределение по виалам',
      description: 'Разлейте суспензию в криовиалы',
      requirements: [
        'Аликвотируйте по 1-2 мл в каждую виалу',
        'Плотно закрутите крышки',
        'Проверьте этикетки',
        'Немедленно переходите к заморозке'
      ],
      warnings: [
        'Минимизируйте время при комнатной температуре',
        'Не переполняйте виалы (оставьте 20% воздуха)'
      ]
    },
    {
      stepNumber: 6,
      title: 'Контролируемая заморозка',
      description: 'Заморозьте клетки с контролируемой скоростью',
      requirements: [
        'Поместите виалы в freezing container',
        'Поставьте в морозильник -80°C',
        'Замораживайте минимум 4 часа (лучше overnight)',
        'Скорость охлаждения: ~1°C/минуту'
      ],
      tips: [
        'Freezing container с изопропанолом обеспечивает -1°C/мин',
        'Не используйте контейнер > 10 раз без замены изопропанола'
      ]
    },
    {
      stepNumber: 7,
      title: 'Перенос в долгосрочное хранение',
      description: 'Переместите в жидкий азот или -150°C',
      requirements: [
        'Перенесите замороженные виалы в жидкий азот',
        'Зарегистрируйте точную локацию',
        'Обновите инвентарь',
        'Создайте бэкап данных'
      ],
      warnings: [
        'Используйте криозащитные перчатки',
        'Работайте в проветриваемом помещении'
      ]
    }
  ],
  postProcessChecks: [
    'Все виалы промаркированы и зарегистрированы',
    'Локация хранения задокументирована',
    'Контрольная виала для проверки разморозки (рекомендуется)',
    'Данные внесены в систему',
    'Сертификат банкирования создан (для MCB/WCB)'
  ]
}

// ==================== MEDIA PREPARATION GUIDANCE ====================
export const mediaPrepGuidance: ProcessGuidance = {
  processType: 'media_preparation',
  title: 'Приготовление культуральной среды',
  description: 'Подготовка полной культуральной среды из базовых компонентов',
  sopReference: 'SOP-MED-002',
  estimatedTime: '30-45 минут',
  requiredEquipment: ['Ламинарный бокс', 'Стерильная посуда', 'Бутылки для хранения'],
  requiredMaterials: ['Базовая среда', 'FBS', 'Антибиотики', 'Добавки'],
  steps: [
    {
      stepNumber: 1,
      title: 'Подготовка и расчеты',
      description: 'Рассчитайте объемы компонентов',
      requirements: [
        'Выберите рецепт среды из справочника',
        'Рассчитайте объемы всех компонентов',
        'Проверьте наличие всех материалов',
        'Проверьте сроки годности',
        'Подготовьте стерильные бутылки'
      ],
      warnings: [
        'Используйте только материалы в пределах срока годности',
        'Проверьте сертификаты анализа для критических компонентов'
      ]
    },
    {
      stepNumber: 2,
      title: 'Размораживание компонентов',
      description: 'Разморозьте и прогрейте замороженные компоненты',
      requirements: [
        'Разморозьте FBS при 4°C overnight или на водяной бане',
        'Прогрейте базовую среду до комнатной температуры',
        'Подготовьте все добавки'
      ],
      tips: [
        'FBS: размораживайте в холодильнике для минимизации осадка',
        'Не перегревайте компоненты'
      ]
    },
    {
      stepNumber: 3,
      title: 'Смешивание компонентов',
      description: 'Добавьте все компоненты согласно рецепту',
      requirements: [
        'Работайте в ламинарном боксе',
        'Добавляйте компоненты в порядке: базовая среда → сыворотка → добавки',
        'Аккуратно перемешивайте после каждого добавления',
        'Избегайте пены'
      ],
      warnings: [
        'Не добавляйте антибиотики в горячую среду',
        'Стерильная техника критична'
      ]
    },
    {
      stepNumber: 4,
      title: 'Фильтрация (если требуется)',
      description: 'Стерилизуйте фильтрованием при необходимости',
      requirements: [
        'Используйте 0.22 мкм фильтр',
        'Фильтруйте в стерильную бутылку',
        'Следите за скоростью фильтрации'
      ],
      tips: [
        'Фильтрация обычно не требуется для покупных компонентов',
        'Обязательна для сред с нестандартными добавками'
      ]
    },
    {
      stepNumber: 5,
      title: 'Маркировка и хранение',
      description: 'Промаркируйте и поместите на хранение',
      requirements: [
        'Этикетка: название, дата приготовления, срок годности, партия',
        'Зарегистрируйте партию в системе',
        'Храните при 4°C',
        'Защищайте от света (для светочувствительных компонентов)'
      ],
      requiredFields: ['batch_code', 'preparation_date', 'expiry_date', 'recipe_id']
    },
    {
      stepNumber: 6,
      title: 'Тест на стерильность',
      description: 'Отберите образец для теста стерильности',
      requirements: [
        'Отберите 5-10 мл в стерильную пробирку',
        'Инкубируйте при 37°C 48-72 часа',
        'Проверьте на помутнение/рост',
        'Зарегистрируйте результат'
      ],
      warnings: [
        'Не используйте среду до подтверждения стерильности',
        'При контаминации утилизируйте всю партию'
      ]
    }
  ],
  postProcessChecks: [
    'Партия зарегистрирована в системе',
    'Проба на стерильность отобрана',
    'Этикетки проверены',
    'Хранение при правильной температуре',
    'Документация заполнена'
  ]
}

// ==================== CELL COUNTING GUIDANCE ====================
export const cellCountingGuidance: ProcessGuidance = {
  processType: 'cell_counting',
  title: 'Подсчет клеток и определение жизнеспособности',
  description: 'Точный подсчет концентрации клеток и оценка жизнеспособности',
  sopReference: 'SOP-CULT-002',
  estimatedTime: '10-15 минут',
  requiredEquipment: ['Микроскоп', 'Камера Горяева', 'Счетчик'],
  requiredMaterials: ['Трипановый синий', 'PBS', 'Пипетки'],
  steps: [
    {
      stepNumber: 1,
      title: 'Подготовка образца',
      description: 'Приготовьте суспензию клеток',
      requirements: [
        'Тщательно перемешайте клеточную суспензию',
        'Возьмите репрезентативную аликвоту',
        'При необходимости разведите'
      ],
      tips: [
        'Для густой суспензии: разведение 1:2 или 1:5',
        'Для редкой суспензии: считайте без разведения'
      ]
    },
    {
      stepNumber: 2,
      title: 'Окрашивание трипановым синим',
      description: 'Смешайте с красителем для оценки жизнеспособности',
      requirements: [
        'Смешайте клетки с трипановым синим 1:1',
        'Инкубируйте 2-3 минуты',
        'Загрузите в камеру Горяева'
      ],
      warnings: [
        'Не передерживайте - трипановый синий токсичен',
        'Избегайте пузырьков при загрузке'
      ]
    },
    {
      stepNumber: 3,
      title: 'Подсчет под микроскопом',
      description: 'Подсчитайте клетки в сетке камеры',
      requirements: [
        'Подсчитайте минимум 4 больших квадрата',
        'Считайте живые (светлые) отдельно от мертвых (синие)',
        'Используйте правило границ для точности'
      ],
      tips: [
        'Правило границ: считайте клетки, касающиеся левой и верхней границ',
        'Оптимально: 20-50 клеток на квадрат'
      ],
      ccaCriteria: [
        {
          parameter: 'Минимальное количество подсчитанных клеток',
          range: '≥ 100 клеток',
          critical: false
        }
      ]
    },
    {
      stepNumber: 4,
      title: 'Расчет концентрации',
      description: 'Вычислите концентрацию клеток',
      requirements: [
        'Используйте формулу: клеток/мл = (среднее на квадрат) × 10⁴ × фактор разведения',
        'Рассчитайте общее количество клеток',
        'Проверьте расчеты'
      ],
      requiredFields: ['cell_concentration', 'total_cells', 'dilution_factor']
    },
    {
      stepNumber: 5,
      title: 'Расчет жизнеспособности',
      description: 'Определите процент живых клеток',
      requirements: [
        'Формула: жизнеспособность % = (живые / (живые + мертвые)) × 100',
        'Запишите результат',
        'Сравните с CCA критериями'
      ],
      requiredFields: ['viability_percent'],
      ccaCriteria: [
        {
          parameter: 'Жизнеспособность',
          range: '≥ 85% (общий случай), ≥ 90% (для заморозки), ≥ 70% (после разморозки)',
          critical: true
        }
      ],
      warnings: [
        'При жизнеспособности < 85% проверьте условия культивирования',
        'При жизнеспособности < 70% проконсультируйтесь с QP'
      ]
    },
    {
      stepNumber: 6,
      title: 'Документирование',
      description: 'Внесите данные в систему',
      requirements: [
        'Запишите все результаты',
        'Сфотографируйте (опционально)',
        'Отметьте любые необычные наблюдения'
      ]
    }
  ],
  postProcessChecks: [
    'Данные внесены в систему',
    'CCA критерии проверены',
    'При отклонениях - deviation зарегистрировано',
    'Камера Горяева очищена'
  ]
}

// ==================== GUIDANCE REGISTRY ====================
export const processGuidanceRegistry: Record<string, ProcessGuidance> = {
  passage: passageGuidance,
  thawing: thawingGuidance,
  freezing: freezingGuidance,
  media_preparation: mediaPrepGuidance,
  cell_counting: cellCountingGuidance
}

/**
 * Get guidance for a specific process type
 */
export function getProcessGuidance(processType: string): ProcessGuidance | null {
  return processGuidanceRegistry[processType] || null
}

/**
 * Get specific step guidance
 */
export function getStepGuidance(processType: string, stepNumber: number): ProcessStep | null {
  const guidance = getProcessGuidance(processType)
  if (!guidance) return null

  return guidance.steps.find(step => step.stepNumber === stepNumber) || null
}

/**
 * Get CCA criteria for a specific step
 */
export function getCCACriteria(processType: string, stepNumber: number) {
  const step = getStepGuidance(processType, stepNumber)
  return step?.ccaCriteria || []
}

/**
 * Validate field value against CCA criteria
 */
export function validateAgainstCCA(
  processType: string,
  stepNumber: number,
  parameterName: string,
  value: number
): { isValid: boolean; message?: string; critical?: boolean } {
  const criteria = getCCACriteria(processType, stepNumber)
  const criterion = criteria.find(c => c.parameter.toLowerCase().includes(parameterName.toLowerCase()))

  if (!criterion) {
    return { isValid: true }
  }

  // Parse range and validate
  // This is a simplified version - in production, use more robust parsing
  const rangeMatch = criterion.range.match(/≥\s*(\d+)/)
  if (rangeMatch) {
    const minValue = parseFloat(rangeMatch[1])
    if (value < minValue) {
      return {
        isValid: false,
        message: `${criterion.parameter} ниже минимума (${criterion.range})`,
        critical: criterion.critical
      }
    }
  }

  return { isValid: true }
}
