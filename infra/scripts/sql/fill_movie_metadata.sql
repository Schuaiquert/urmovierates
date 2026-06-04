-- ============================================================
-- Preenchimento de trailer, poster e duration
-- Data: 2026-06-03
-- Estratégia: cada campo só atualiza onde está NULL/vazio
--             (idempotente — não sobrescreve dados já existentes)
-- ============================================================

BEGIN;

-- ============== TRAILERS (28 filmes sem trailer) ==============
-- Padrão de URL: https://www.youtube.com/watch?v=<VIDEO_ID>

UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=vZ734NWnAHA' WHERE id = 'star-wars-iv'           AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=W6Mm8Sbe__o' WHERE id = 'silence-of-the-lambs'  AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=dwGf3IyQykg' WHERE id = 'schindlers-list'       AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=lcHkkN9Ii04' WHERE id = 'jurassic-park'         AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=4sj1MT05l3g' WHERE id = 'the-lion-king'         AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=v-PjgYh4-4U' WHERE id = 'toy-story'             AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=kVrqfYjkTdQ' WHERE id = 'titanic'               AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=SUXWAEX2jlg' WHERE id = 'fight-club'            AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=vKQi3bBA1y8' WHERE id = 'the-matrix'            AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=P5ieIbIrF48' WHERE id = 'gladiator'             AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=ByXuk9QqQkk' WHERE id = 'spirited-away'         AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=V75dMMIW2B4' WHERE id = 'lotr-fellowship'       AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=W37DlG13i2U' WHERE id = 'shrek'                 AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=r5X-hFf6Bwo' WHERE id = 'lotr-return-king'      AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=2hL3G6ZepAM' WHERE id = 'finding-nemo'          AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=SGWvwDRH4Co' WHERE id = 'the-departed'          AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=4eaZ_48ZYog' WHERE id = 'superbad'              AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=tcdUhdOlz9M' WHERE id = 'the-hangover'          AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=YoHD9XEInc0' WHERE id = 'inception'             AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=eOrNdBpGMv8' WHERE id = 'the-avengers'          AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=k10ETZ41IC8' WHERE id = 'the-conjuring'         AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=iszwuX1AK6A' WHERE id = 'wolf-of-wall-street'   AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=ddYSde3HoLE' WHERE id = 'whiplash'              AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=0pdqf4P9MB8' WHERE id = 'la-la-land'            AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=V6wWKNij_1M' WHERE id = 'hereditary'            AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=zAGVQLHvwOY' WHERE id = 'joker'                 AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=5xH0HfJHsaY' WHERE id = 'parasite'              AND trailer IS NULL;
UPDATE movies SET trailer = 'https://www.youtube.com/watch?v=d9MyW72ELq0' WHERE id = 'avatar-way-of-water'   AND trailer IS NULL;

-- ============== POSTERS (defensivo: só preenche onde está NULL) ==============
-- Todos os 42 filmes já têm poster, mas mantemos o bloco idempotente
-- caso um INSERT futuro esqueça o campo. URLs do TMDB w500 (mesmo padrão existente).

UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' WHERE id = 'the-godfather'            AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg' WHERE id = 'star-wars-iv'            AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg' WHERE id = 'silence-of-the-lambs'   AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg' WHERE id = 'jurassic-park'          AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg' WHERE id = 'schindlers-list'        AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg' WHERE id = 'the-shawshank-redemption' AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg' WHERE id = 'the-lion-king'          AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg' WHERE id = 'pulp-fiction'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg' WHERE id = 'forrest-gump'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg' WHERE id = 'toy-story'              AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg' WHERE id = 'titanic'                AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg' WHERE id = 'fight-club'             AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' WHERE id = 'the-matrix'             AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg' WHERE id = 'gladiator'              AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg' WHERE id = 'lotr-fellowship'        AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg' WHERE id = 'shrek'                  AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' WHERE id = 'spirited-away'          AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg' WHERE id = 'lotr-return-king'       AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg' WHERE id = 'finding-nemo'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg'  WHERE id = 'the-departed'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg' WHERE id = 'superbad'               AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' WHERE id = 'the-dark-knight'        AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg' WHERE id = 'f147c4cc-1b1e-4b37-89aa-be7e89cdbb5e' AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg' WHERE id = 'avatar'                 AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9VHCLWDAYP.jpg' WHERE id = 'the-hangover'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg' WHERE id = 'inception'              AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg'  WHERE id = 'the-avengers'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/sOxr33wnRuKazR9ClHek73T8qnK.jpg' WHERE id = 'wolf-of-wall-street'    AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg' WHERE id = 'the-conjuring'          AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' WHERE id = 'interstellar'           AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg' WHERE id = 'whiplash'               AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg' WHERE id = 'la-la-land'             AND poster IS NULL;
UPDATE movies SET poster = 'https://upload.wikimedia.org/wikipedia/pt/2/21/Warcraft_poster.jpg' WHERE id = '179904ad-62ab-4115-a3ab-26f3fab08fca' AND poster IS NULL;
UPDATE movies SET poster = 'https://m.media-amazon.com/images/I/61RsJbAFxbS._AC_UF894,1000_QL80_.jpg' WHERE id = 'get-out'         AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3HtEJEqbIwkFGUhVXD.jpg' WHERE id = 'hereditary'             AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg' WHERE id = 'joker'                  AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' WHERE id = 'parasite'               AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg' WHERE id = 'spider-man-nwh'         AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg' WHERE id = 'dune-2021'              AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg' WHERE id = 'top-gun-maverick'       AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg' WHERE id = 'the-batman-2022'        AND poster IS NULL;
UPDATE movies SET poster = 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg' WHERE id = 'avatar-way-of-water'    AND poster IS NULL;

-- ============== DURATION (defensivo: só preenche onde está NULL) ==============
-- Durações oficiais em minutos.

UPDATE movies SET duration = 175 WHERE id = 'the-godfather'              AND duration IS NULL;
UPDATE movies SET duration = 121 WHERE id = 'star-wars-iv'               AND duration IS NULL;
UPDATE movies SET duration = 118 WHERE id = 'silence-of-the-lambs'      AND duration IS NULL;
UPDATE movies SET duration = 127 WHERE id = 'jurassic-park'             AND duration IS NULL;
UPDATE movies SET duration = 195 WHERE id = 'schindlers-list'           AND duration IS NULL;
UPDATE movies SET duration = 142 WHERE id = 'the-shawshank-redemption'  AND duration IS NULL;
UPDATE movies SET duration =  88 WHERE id = 'the-lion-king'             AND duration IS NULL;
UPDATE movies SET duration = 154 WHERE id = 'pulp-fiction'              AND duration IS NULL;
UPDATE movies SET duration = 142 WHERE id = 'forrest-gump'              AND duration IS NULL;
UPDATE movies SET duration =  81 WHERE id = 'toy-story'                 AND duration IS NULL;
UPDATE movies SET duration = 195 WHERE id = 'titanic'                   AND duration IS NULL;
UPDATE movies SET duration = 139 WHERE id = 'fight-club'                AND duration IS NULL;
UPDATE movies SET duration = 136 WHERE id = 'the-matrix'                AND duration IS NULL;
UPDATE movies SET duration = 155 WHERE id = 'gladiator'                 AND duration IS NULL;
UPDATE movies SET duration = 178 WHERE id = 'lotr-fellowship'           AND duration IS NULL;
UPDATE movies SET duration =  90 WHERE id = 'shrek'                     AND duration IS NULL;
UPDATE movies SET duration = 125 WHERE id = 'spirited-away'             AND duration IS NULL;
UPDATE movies SET duration = 201 WHERE id = 'lotr-return-king'          AND duration IS NULL;
UPDATE movies SET duration = 100 WHERE id = 'finding-nemo'              AND duration IS NULL;
UPDATE movies SET duration = 151 WHERE id = 'the-departed'              AND duration IS NULL;
UPDATE movies SET duration = 113 WHERE id = 'superbad'                  AND duration IS NULL;
UPDATE movies SET duration = 152 WHERE id = 'the-dark-knight'           AND duration IS NULL;
UPDATE movies SET duration = 126 WHERE id = 'f147c4cc-1b1e-4b37-89aa-be7e89cdbb5e' AND duration IS NULL;
UPDATE movies SET duration = 162 WHERE id = 'avatar'                    AND duration IS NULL;
UPDATE movies SET duration = 100 WHERE id = 'the-hangover'              AND duration IS NULL;
UPDATE movies SET duration = 148 WHERE id = 'inception'                 AND duration IS NULL;
UPDATE movies SET duration = 143 WHERE id = 'the-avengers'              AND duration IS NULL;
UPDATE movies SET duration = 180 WHERE id = 'wolf-of-wall-street'       AND duration IS NULL;
UPDATE movies SET duration = 112 WHERE id = 'the-conjuring'             AND duration IS NULL;
UPDATE movies SET duration = 169 WHERE id = 'interstellar'              AND duration IS NULL;
UPDATE movies SET duration = 107 WHERE id = 'whiplash'                  AND duration IS NULL;
UPDATE movies SET duration = 128 WHERE id = 'la-la-land'                AND duration IS NULL;
UPDATE movies SET duration = 123 WHERE id = '179904ad-62ab-4115-a3ab-26f3fab08fca' AND duration IS NULL;
UPDATE movies SET duration = 104 WHERE id = 'get-out'                   AND duration IS NULL;
UPDATE movies SET duration = 127 WHERE id = 'hereditary'                AND duration IS NULL;
UPDATE movies SET duration = 122 WHERE id = 'joker'                     AND duration IS NULL;
UPDATE movies SET duration = 132 WHERE id = 'parasite'                  AND duration IS NULL;
UPDATE movies SET duration = 148 WHERE id = 'spider-man-nwh'            AND duration IS NULL;
UPDATE movies SET duration = 155 WHERE id = 'dune-2021'                 AND duration IS NULL;
UPDATE movies SET duration = 131 WHERE id = 'top-gun-maverick'          AND duration IS NULL;
UPDATE movies SET duration = 176 WHERE id = 'the-batman-2022'           AND duration IS NULL;
UPDATE movies SET duration = 192 WHERE id = 'avatar-way-of-water'       AND duration IS NULL;

COMMIT;
