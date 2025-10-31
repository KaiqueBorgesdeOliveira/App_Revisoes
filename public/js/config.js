// Exporta a configuração diretamente em window para garantir acessibilidade global
window.escritoriosConfig = {
    "MG": {  // Mario Garnero (abreviação MG)
        nome: "Mario Garnero",
        andares: {
            "8":  { maxSalas: 5},
            "9":  { maxSalas: 5},
            "10": { maxSalas: 3},
            "12": { maxSalas: 7},
            "13": { maxSalas: 6 }
        }
    },
    "FL": { // Faria Lima
        nome: "Faria Lima",
        andares: {
            "T":  { maxSalas: 3 },  // Térreo: T.2, T.3, T.4
            "1":  { maxSalas: 1 },  // 1.0 - Treinamento
            "2":  { maxSalas: 3 },  // 2.1, 2.2, 2.3
            "3":  { maxSalas: 3 },  // 3.1, 3.2, 3.3
            "4":  { maxSalas: 2 },  // 4.1, 4.3
            "5":  { maxSalas: 4 },  // 5.1, 5.2, 5.3, 5.4
            "6":  { maxSalas: 2 },  // 6.1, 6.2
            "7":  { maxSalas: 3 },  // 7.1, 7.2, 7.4
            "8":  { maxSalas: 4 },  // 8.1, 8.2, 8.3, 8.4 Design Lab
            "9":  { maxSalas: 3 },  // 9.1, 9.2, 9.3
            "10": { maxSalas: 1 },  // 10 Diretoria
            "11": { maxSalas: 4 }   // 11.1, 11.2, 11.3, 11.4
        }
    },
    "Berrini": { // Berrini (salas fornecidas)
        nome: "Berrini",
        andares: {
            "8": { maxSalas: 3 }, // 3.1, 4.1, 4.2 (todas no 8º)
            "9": { maxSalas: 2 }  // 4.3, 4.4 (no 9º)
        }
    },
    "BL": { // Barão de Limeira
        nome: "Barão de Limeira",
        andares: {
            "1": { maxSalas: 7 },  // 1.1 até 1.7
            "2": { maxSalas: 6 },  // 2.1 até 2.5 + Sala de Treinamento BL 2 - RH
            "6": { maxSalas: 6 },  // 6.1 até 6.6
            "7": { maxSalas: 6 }   // 7.1 até 7.5 + Sala de suprimentos
        }
    }
    // adicionar outros escritórios aqui quando necessário
};

// Estilos responsivos mínimos (mantidos aqui para compatibilidade)
const responsiveStyles = `
    @media (max-width: 600px) {
        .sala-card {
            flex: 1 1 100%;
            max-width: 100%;
            padding: 8px;
        }
        .card-footer {
            flex-direction: column;
            align-items: stretch;
        }
        .card-footer .btn {
            width: 100%;
            margin-bottom: 8px;
        }
    }
`;
const style = document.createElement('style');
style.appendChild(document.createTextNode(responsiveStyles));
document.head.appendChild(style);