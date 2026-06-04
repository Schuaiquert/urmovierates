-- ============================================================
-- Tradução de filmes para Português Brasileiro
-- Data: 2026-06-03
-- Aplica-se a todos os registros da tabela movies
-- ============================================================

BEGIN;

-- 1) The Shawshank Redemption (1994)
UPDATE movies
SET title = 'Um Sonho de Liberdade',
    synopsis = 'Dois homens presos se aproximam ao longo de vários anos, encontrando consolo e eventual redenção por meio de atos de decência comum.'
WHERE id = 'the-shawshank-redemption';

-- 2) The Godfather (1972)
UPDATE movies
SET title = 'O Poderoso Chefão',
    synopsis = 'O patriarca aging de uma dinastia do crime organizado transfere o controle de seu império clandestino para seu filho relutante.'
WHERE id = 'the-godfather';

-- 3) The Dark Knight (2008)
UPDATE movies
SET title = 'O Cavaleiro das Trevas',
    synopsis = 'Quando a ameaça conhecida como Coringa semeia o caos sobre o povo de Gotham, Batman precisa aceitar um dos maiores testes psicológicos e físicos de sua capacidade de combater a injustiça.'
WHERE id = 'the-dark-knight';

-- 4) Pulp Fiction (1994)
UPDATE movies
SET title = 'Pulp Fiction: Tempo de Violência',
    synopsis = 'A vida de dois capangas da máfia, um boxeador, um gângster e sua esposa, e um casal de assaltantes de restaurante se entrelaçam em quatro histórias de violência e redenção.'
WHERE id = 'pulp-fiction';

-- 5) Forrest Gump (1994)
UPDATE movies
SET title = 'Forrest Gump: O Contador de Histórias',
    synopsis = 'As presidências de Kennedy e Johnson, a Guerra do Vietnã, o escândalo de Watergate e outros eventos históricos se desenrolam sob a perspectiva de um homem do Alabama com QI de 75.'
WHERE id = 'forrest-gump';

-- 6) Iron Man (2008)
UPDATE movies
SET title = 'Homem de Ferro',
    synopsis = 'Depois de ser mantido refém em uma caverna, o bilionário inventor Tony Stark constrói um traje de alta tecnologia e se torna o super-herói Homem de Ferro para combater o mal e proteger o mundo.'
WHERE id = 'f147c4cc-1b1e-4b37-89aa-be7e89cdbb5e';

-- 7) Warcraft (2016)
UPDATE movies
SET title = 'Warcraft: O Primeiro Encontro de Dois Mundos',
    synopsis = 'O pacífico reino de Azeroth está à beira da guerra quando uma raça de invasores atravessa o portal sombrio, e os heróis de cada lado embarcam em um conflito que decidirá o destino de suas famílias e seu lar.'
WHERE id = '179904ad-62ab-4115-a3ab-26f3fab08fca';

COMMIT;
