(() => {
    'use strict';

    // ========================================================
    // CARTES DE L’ATELIER — MODIFIEZ UNIQUEMENT CE TABLEAU
    // ========================================================
    // id     : identifiant unique
    // phase  : 1 (toutes les cartes visibles) ou 2 (une par une)
    // label  : titre affiché sur la carte
    // weight : poids 1 ou 2 (nombre de pastilles)
    // side   : catégorie de référence, sans effet sur le placement
    //          'left' = ressource, 'right' = contrainte
    //
    // Pour ajouter une carte : dupliquez un objet et modifiez son id.
    // Pour retirer une carte : supprimez son objet.
    // L'ordre des cartes de phase 2 définit leur ordre d'apparition.

    const DATA = [
        {
            id: 'p1-r1',
            phase: 1,
            label: 'Fierté liée au travail',
            weight: 2,
            side: 'left'
        },
        {
            id: 'p1-r2',
            phase: 1,
            label: 'Couple solide',
            weight: 1,
            side: 'left'
        },
        {
            id: 'p1-r3',
            phase: 1,
            label: 'Moments de complicité avec son fils',
            weight: 1,
            side: 'left'
        },
        {
            id: 'p1-c1',
            phase: 1,
            label: 'Proche aidante',
            weight: 2,
            side: 'right'
        },
        {
            id: 'p2-r1',
            phase: 2,
            label: 'Stimulation liée au projet',
            weight: 1,
            side: 'left'
        },
        {
            id: 'p2-c1',
            phase: 2,
            label: 'Manque de reconnaissance',
            weight: 1,
            side: 'right'
        },
        {
            id: 'p2-c2',
            phase: 2,
            label: 'Surcharge de travail',
            weight: 2,
            side: 'right'
        },
        {
            id: 'p2-c3',
            phase: 2,
            label: 'Encaisser sans rien montrer',
            weight: 1,
            side: 'right'
        }
    ];

    // ========================================================
    // ÉTAT DE L’ACTIVITÉ
    // ========================================================

    const P1 = DATA.filter(card => card.phase === 1);
    const P2 = DATA.filter(card => card.phase === 2);
    const placements = Object.fromEntries(DATA.map(card => [card.id, null]));
    const $ = id => document.getElementById(id);

    let phase = 1;
    let shown = 0;

    // ========================================================
    // OUTILS ET INTERACTIONS
    // ========================================================

    function button(label, callback, className) {
        const element = document.createElement('button');
        element.type = 'button';
        element.textContent = label;
        element.className = className;
        element.addEventListener('click', callback);
        return element;
    }

    function visible(card) {
        return card.phase === 1 || (
            phase === 2 && P2.indexOf(card) < shown
        );
    }

    function put(id, side) {
        const card = DATA.find(item => item.id === id);

        if (!card || !visible(card)) {
            return;
        }

        placements[id] = side;
        render();
    }

    // ========================================================
    // PANNEAU DE CARTES
    // ========================================================

    function renderCards() {
        const container = $('cards');
        container.replaceChildren();

        const cardsToShow = phase === 1
            ? P1
            : shown
                ? [P2[shown - 1]]
                : [];

        const availableCards = cardsToShow.filter(card => !placements[card.id]);

        for (const cardData of availableCards) {
            const card = document.createElement('div');
            card.className = 'card';

            const dots = document.createElement('div');
            dots.className = 'card-dots';
            dots.setAttribute('aria-label', `Poids : ${cardData.weight}`);

            for (let i = 0; i < cardData.weight; i++) {
                const dot = document.createElement('span');
                dot.className = 'card-dot';
                dot.setAttribute('aria-hidden', 'true');
                dots.appendChild(dot);
            }

            const title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = cardData.label;

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const choices = [
                ['left', '+ Ressources', 'resources'],
                ['right', '+ Contraintes', 'constraints']
            ];

            for (const [side, label, className] of choices) {
                const action = button(
                    label,
                    () => put(cardData.id, side),
                    `choice ${className}`
                );

                const destination = side === 'left' ? 'Ressources' : 'Contraintes';
                action.setAttribute(
                    'aria-label',
                    `Placer ${cardData.label} sur ${destination}`
                );

                actions.appendChild(action);
            }

            card.append(dots, title, actions);
            container.appendChild(card);
        }
    }

    // ========================================================
    // PHASES ET BOUTONS DE PROGRESSION
    // ========================================================

    function renderPhase() {
        const next = $('next');
        const phaseTitle = $('phase-title');

        phaseTitle.textContent = phase === 1
            ? 'Phase 1 : situation initiale'
            : 'Phase 2 : le projet transverse';

        next.hidden = false;

        if (phase === 1) {
            next.textContent = 'Démarrer la seconde phase';
            next.disabled = !P1.every(card => placements[card.id]);
        } else {
            next.textContent = 'Afficher carte suivante';
            next.hidden = shown === P2.length && !!placements[P2[P2.length - 1].id];
            next.disabled = shown > 0 && !placements[P2[shown - 1].id];
        }

        const done = phase === 2
            && shown === P2.length
            && !!placements[P2[P2.length - 1].id];

        document.querySelector('.panel-footer').classList.toggle('finished', done);
    }

    // ========================================================
    // ÉLÉMENTS DÉPOSÉS SUR LA BALANCE
    // ========================================================

    function renderItems(side, elementId) {
        const container = $(elementId);
        container.replaceChildren();

        for (const card of DATA.filter(item => placements[item.id] === side)) {
            const placed = button(
                `${card.label} ×`,
                () => put(card.id, null),
                'placed'
            );

            placed.title = 'Retirer cette carte de la balance';
            placed.setAttribute('aria-label', `Retirer ${card.label} de la balance`);
            container.appendChild(placed);
        }
    }

    function renderBalance() {
        let left = 0;
        let right = 0;

        for (const card of DATA) {
            if (placements[card.id] === 'left') {
                left += card.weight;
            }
            if (placements[card.id] === 'right') {
                right += card.weight;
            }
        }

        $('left-weight').textContent = left;
        $('right-weight').textContent = right;

        renderItems('left', 'left-items');
        renderItems('right', 'right-items');

        // 10 crans maximum dans chaque direction : 1 poids = 1 cran.
        const diff = right - left;
        const crans = Math.max(-10, Math.min(10, diff));
        const angle = crans * (12 / 10);
        const theta = angle * Math.PI / 180;

        $('beam').style.transform = `rotate(${angle}deg)`;

        const sides = [
            ['left', -1, 'pan-left', 'ropes-left'],
            ['right', 1, 'pan-right', 'ropes-right']
        ];

        for (const [side, sign, panId, ropeId] of sides) {
            const x = 450 + sign * 240 * Math.cos(theta);
            const y = 160 + sign * 240 * Math.sin(theta);
            const top = y + 145;
            const pan = $(panId);

            pan.style.left = `${x / 900 * 100}%`;
            pan.style.top = `${top / 600 * 100}%`;

            $(ropeId).setAttribute(
                'd',
                `M ${x} ${y} L ${x - 98} ${top + 4} M ${x} ${y} L ${x + 98} ${top + 4}`
            );
        }

        const status = $('status');
        status.textContent = diff === 0
            ? 'La balance est équilibrée'
            : diff > 0
                ? 'Les contraintes pèsent davantage'
                : 'Les ressources pèsent davantage';

        status.classList.remove('is-balanced', 'is-resources', 'is-constraints');
        status.classList.add(
            diff === 0
                ? 'is-balanced'
                : diff > 0
                    ? 'is-constraints'
                    : 'is-resources'
        );
    }

    // ========================================================
    // RENDU ET ÉVÉNEMENTS
    // ========================================================

    function render() {
        renderCards();
        renderPhase();
        renderBalance();
    }

    $('next').addEventListener('click', () => {
        if (phase === 1) {
            if (!P1.every(card => placements[card.id])) {
                return;
            }

            phase = 2;
            shown = 0;
        } else if (
            shown < P2.length
            && (shown === 0 || placements[P2[shown - 1].id])
        ) {
            shown++;
        }

        render();
    });

    $('reset').addEventListener('click', () => {
        if (!window.confirm('Recommencer l’atelier depuis la phase 1 ?')) {
            return;
        }

        for (const id of Object.keys(placements)) {
            placements[id] = null;
        }

        phase = 1;
        shown = 0;
        render();
    });

    render();
})();
