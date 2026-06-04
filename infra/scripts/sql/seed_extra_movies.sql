-- ============================================================
-- Adição de 35 filmes em Português Brasileiro
-- Data: 2026-06-03
-- Padrão: título PT-BR oficial + sinopse PT-BR + gêneros via movie_genres
-- ============================================================

BEGIN;

-- Gêneros (Title Case, já existentes — sem acentos duplicados):
-- Animação:        3dbaee88-be67-476f-b592-c351f736e216
-- Ação:            6972fdff-0bae-48b3-8039-9e9727ade09a
-- Comédia:         2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2
-- Drama:           17c49ddc-bb52-449a-b33f-c85a703eb267
-- Ficção Científ.: e1505faf-d091-465e-9aa1-8ddf7c0837bc
-- Romance:         bdb548c5-6a57-4795-9520-33b24c00d605
-- Terror:          6c8ff3f4-a36f-4f1f-b2e1-58afd693f361

-- ============== INSERTS DE FILMES ==============

INSERT INTO movies (id, title, synopsis, year, active, "createdAt", "updatedAt") VALUES
  ('the-matrix', 'Matrix', 'Um hacker descobre que a realidade em que vive é uma simulação criada por máquinas e se junta a um grupo de rebeldes para libertar a humanidade.', 1999, true, NOW(), NOW()),
  ('inception', 'A Origem', 'Um ladrão especializado em roubar segredos do subconsciente recebe a tarefa inversa: plantar uma ideia na mente de alguém por meio do sonho compartilhado.', 2010, true, NOW(), NOW()),
  ('avatar', 'Avatar', 'Um ex-fuzileiro naval paraplégico é enviado à Pandora, onde se infiltra entre os nativos Na''vi e se vê dividido entre seguir ordens e proteger o mundo que passou a amar.', 2009, true, NOW(), NOW()),
  ('titanic', 'Titanic', 'Um artista pobre e uma jovem rica se apaixonam a bordo do luxuoso e fatídico navio que afundou em sua viagem inaugural em 1912.', 1997, true, NOW(), NOW()),
  ('gladiator', 'Gladiador', 'Um general romano é traído e transformado em escravo, lutando como gladiador enquanto busca vingar a morte de sua família e do imperador.', 2000, true, NOW(), NOW()),
  ('lotr-fellowship', 'O Senhor dos Anéis: A Sociedade do Anel', 'Um hobbit herda um anel poderoso e deve embarcar em uma jornada épica para destruí-lo antes que o Senhor das Trevas o recupere.', 2001, true, NOW(), NOW()),
  ('lotr-return-king', 'O Senhor dos Anéis: O Retorno do Rei', 'Enquanto Frodo e Sam se aproximam da Montanha da Perdição, Aragorn lidera os homens do reino contra o exército de Sauron na Batalha dos Campos do Pelennor.', 2003, true, NOW(), NOW()),
  ('star-wars-iv', 'Star Wars: Uma Nova Esperança', 'Um jovem fazendeiro se une a um cavaleiro Jedi, um contrabandista e seus aliados para resgatar uma princesa e enfrentar o Império Galáctico.', 1977, true, NOW(), NOW()),
  ('jurassic-park', 'Parque dos Dinossauros', 'Um paleontólogo e dois outros cientistas são convidados a avaliar um parque temático com dinossauros clonados antes de sua abertura ao público.', 1993, true, NOW(), NOW()),
  ('silence-of-the-lambs', 'O Silêncio dos Inocentes', 'Uma jovem agente do FBI busca a ajuda de um brilhante mas perturbado assassino canibal para capturar outro serial killer em fuga.', 1991, true, NOW(), NOW()),
  ('schindlers-list', 'A Lista de Schindler', 'O industrial alemão Oskar Schindler salva a vida de mais de mil refugiados judeus durante o Holocausto ao empregá-los em sua fábrica.', 1993, true, NOW(), NOW()),
  ('fight-club', 'Clube da Luta', 'Um funcionário insone e um vendedor de sabonetes carismático fundam um clube de luta clandestino que evolui para um movimento anarquista.', 1999, true, NOW(), NOW()),
  ('the-departed', 'Os Infiltrados', 'Um policial se infiltra na máfia enquanto um criminoso se infiltra na polícia, e ambos tentam identificar o outro antes de serem descobertos.', 2006, true, NOW(), NOW()),
  ('interstellar', 'Interestelar', 'Em um futuro com a Terra agonizando, um ex-piloto da NASA aceita liderar uma expedição através de um buraco de minhoca em busca de um novo lar para a humanidade.', 2014, true, NOW(), NOW()),
  ('the-avengers', 'Os Vingadores', 'Nick Fury reúne os maiores heróis do mundo — Homem de Ferro, Capitão América, Thor, Hulk, Viúva Negra e Gavião Arqueiro — para impedir uma invasão alienígena.', 2012, true, NOW(), NOW()),
  ('spirited-away', 'A Viagem de Chihiro', 'Uma menina de dez anos se perde em um mundo de espíritos e deve trabalhar em uma casa de banhos para salvar seus pais, transformados em porcos.', 2001, true, NOW(), NOW()),
  ('parasite', 'Parasita', 'Uma família pobre se infiltra na casa de uma família rica se passando por funcionários qualificados, até que uma descoberta perturbadora desestabiliza tudo.', 2019, true, NOW(), NOW()),
  ('joker', 'Coringa', 'Um comediante fracassado é empurrado para a loucura e se torna um símbolo de revolta violenta em uma Gotham dominada pelo abandono e desigualdade.', 2019, true, NOW(), NOW()),
  ('whiplash', 'Whiplash: Em Busca da Perfeição', 'Um jovem baterista de jazz entra em uma prestigiosa escola de música e é brutalmente pressionado por um instrutor obcecado pela excelência.', 2014, true, NOW(), NOW()),
  ('wolf-of-wall-street', 'O Lobo de Wall Street', 'A ascensão e queda de um corretor da bolsa que construiu um império baseado em fraude, excessos e drogas nos anos 90.', 2013, true, NOW(), NOW()),
  ('la-la-land', 'La La Land: Cantando Estações', 'Um pianista de jazz e uma atriz em início de carreira se apaixonam em Los Angeles enquanto tentam realizar seus sonhos em uma cidade que não perdoa.', 2016, true, NOW(), NOW()),
  ('avatar-way-of-water', 'Avatar: O Caminho da Água', 'Jake Sully vive em paz com sua nova família na Pandora, mas quando uma ameaça familiar retorna, ele parte com os Na''vi aquáticos para proteger seu lar.', 2022, true, NOW(), NOW()),
  ('top-gun-maverick', 'Top Gun: Maverick', 'Mais de trinta anos após a escola de pilotos, Maverick treina uma nova geração de aviadores para uma missão quase impossível.', 2022, true, NOW(), NOW()),
  ('dune-2021', 'Duna', 'O jovem Paul Atreides vê sua família destruída e embarca em uma jornada de vingança e destino no árido planeta desértico de Arrakis, fonte da especiaria mais valiosa do universo.', 2021, true, NOW(), NOW()),
  ('the-batman-2022', 'The Batman', 'Em seu segundo ano de combate ao crime, o Homem-Morcego descobre a corrupção em Gotham que o conecta à sua própria família enquanto enfrenta o Charada.', 2022, true, NOW(), NOW()),
  ('spider-man-nwh', 'Homem-Aranha: Sem Volta para Casa', 'Peter Parker pede ajuda ao Doutor Estranho para apagar sua identidade revelada, mas o feitiço rompe o multiverso e traz vilões de outras realidades.', 2021, true, NOW(), NOW()),
  ('toy-story', 'Toy Story', 'Um vaqueiro de plástico se sente ameaçado quando um novo e moderno astronauta action figure toma seu lugar como o brinquedo favorito de seu dono.', 1995, true, NOW(), NOW()),
  ('the-lion-king', 'O Rei Leão', 'Um jovem leão príncipe é enganado por seu tio, que o exila. Anos depois, ele precisa aceitar seu destino e reconquistar seu lugar no ciclo da vida.', 1994, true, NOW(), NOW()),
  ('finding-nemo', 'Procurando Nemo', 'Um peixe-palhaço superprotetor atravessa o oceano em uma jornada épica para resgatar seu filho, capturado por mergulhadores.', 2003, true, NOW(), NOW()),
  ('shrek', 'Shrek', 'Um ogro rabugento é forçado a embarcar em uma missão para resgatar uma princesa de um dragão, acompanhado de um burro tagarela que não cala a boca.', 2001, true, NOW(), NOW()),
  ('the-hangover', 'Se Beber, Não Case!', 'Quatro amigos viajam a Las Vegas para a despedida de solteiro de um deles e acordam sem memória da noite anterior, sem o noivo e com um tigre no banheiro.', 2009, true, NOW(), NOW()),
  ('superbad', 'Superbad', 'Dois amigos geeks do ensino médio tentam aproveitar ao máximo uma festa para finalmente conseguirem álcool e se tornarem populares antes de se formarem.', 2007, true, NOW(), NOW()),
  ('get-out', 'Corra!', 'Um jovem fotógrafo negro visita a família de sua namorada branca em sua propriedade rural e logo percebe que algo muito sinistro está por trás de sua hospitalidade.', 2017, true, NOW(), NOW()),
  ('hereditary', 'Hereditário', 'Após a morte da avó, uma família começa a perceber eventos cada vez mais perturbadores, revelando segredos sombrios sobre seu destino.', 2018, true, NOW(), NOW()),
  ('the-conjuring', 'Invocação do Mal', 'Dois investigadores paranormais tentam ajudar uma família aterrorizada por uma presença sombria em sua fazenda isolada na Nova Inglaterra.', 2013, true, NOW(), NOW());

-- ============== RELAÇÕES movie_genres ==============
-- Gêneros disponíveis:
--   Animação:        3dbaee88-be67-476f-b592-c351f736e216
--   Ação:            6972fdff-0bae-48b3-8039-9e9727ade09a
--   Comédia:         2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2
--   Drama:           17c49ddc-bb52-449a-b33f-c85a703eb267
--   Ficção Científ.: e1505faf-d091-465e-9aa1-8ddf7c0837bc
--   Romance:         bdb548c5-6a57-4795-9520-33b24c00d605
--   Terror:          6c8ff3f4-a36f-4f1f-b2e1-58afd693f361

INSERT INTO movie_genres ("movieId", "genreId") VALUES
  ('the-matrix', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('the-matrix', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('inception', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('inception', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('avatar', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('avatar', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('titanic', 'bdb548c5-6a57-4795-9520-33b24c00d605'),
  ('titanic', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('gladiator', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('gladiator', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('lotr-fellowship', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('lotr-fellowship', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('lotr-return-king', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('lotr-return-king', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('star-wars-iv', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('star-wars-iv', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('jurassic-park', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('jurassic-park', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('silence-of-the-lambs', '6c8ff3f4-a36f-4f1f-b2e1-58afd693f361'),
  ('silence-of-the-lambs', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('schindlers-list', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('fight-club', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('the-departed', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('the-departed', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('interstellar', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('interstellar', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('the-avengers', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('the-avengers', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('spirited-away', '3dbaee88-be67-476f-b592-c351f736e216'),
  ('parasite', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('parasite', '6c8ff3f4-a36f-4f1f-b2e1-58afd693f361'),
  ('joker', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('whiplash', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('wolf-of-wall-street', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('wolf-of-wall-street', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('la-la-land', 'bdb548c5-6a57-4795-9520-33b24c00d605'),
  ('la-la-land', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('avatar-way-of-water', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('avatar-way-of-water', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('top-gun-maverick', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('top-gun-maverick', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('dune-2021', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('dune-2021', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('the-batman-2022', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('the-batman-2022', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('spider-man-nwh', '6972fdff-0bae-48b3-8039-9e9727ade09a'),
  ('spider-man-nwh', 'e1505faf-d091-465e-9aa1-8ddf7c0837bc'),
  ('toy-story', '3dbaee88-be67-476f-b592-c351f736e216'),
  ('toy-story', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('the-lion-king', '3dbaee88-be67-476f-b592-c351f736e216'),
  ('finding-nemo', '3dbaee88-be67-476f-b592-c351f736e216'),
  ('finding-nemo', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('shrek', '3dbaee88-be67-476f-b592-c351f736e216'),
  ('shrek', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('the-hangover', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('superbad', '2ca81c4a-aa19-4ff3-89a9-8ed3c8fb9ee2'),
  ('get-out', '6c8ff3f4-a36f-4f1f-b2e1-58afd693f361'),
  ('get-out', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('hereditary', '6c8ff3f4-a36f-4f1f-b2e1-58afd693f361'),
  ('hereditary', '17c49ddc-bb52-449a-b33f-c85a703eb267'),
  ('the-conjuring', '6c8ff3f4-a36f-4f1f-b2e1-58afd693f361');

COMMIT;
