-- Journey App - 具体的なダミーデータ (5件セット)
-- 実際に使える形でのダミーデータ作成

DO $$
DECLARE
    dummy_user_id UUID;
    place_id_1 UUID;
    place_id_2 UUID;
    place_id_3 UUID;
    place_id_4 UUID;
    place_id_5 UUID;
BEGIN
    -- 最新の認証済みユーザーを取得
    SELECT id INTO dummy_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF dummy_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please sign up first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Creating dummy data for user: %', dummy_user_id;

    -- =====================================
    -- ダミーユーザープロフィール
    -- =====================================
    INSERT INTO profiles (
        id,
        name,
        gender,
        age,
        partner_gender,
        must_condition,
        mbti,
        budget_pref,
        purpose_tags,
        demand_tags,
        created_at
    ) VALUES (
        dummy_user_id,
        '山田 桜',
        'female',
        26,
        'either',
        'カメラが趣味で、旅行先での写真撮影が大好きです！美味しいものを食べるのも好きで、現地のグルメスポットを一緒に楽しめる方を探しています。初心者の方でも大歓迎です🌸',
        'ENFP',
        ARRAY[5, 6], -- 5,000〜15,000円、15,000〜30,000円
        ARRAY[1, 2, 3], -- 観光、グルメ、写真撮影
        ARRAY[1, 2], -- 写真を撮ってくれる人、一緒に食事を楽しめる人
        NOW() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        gender = EXCLUDED.gender,
        age = EXCLUDED.age,
        partner_gender = EXCLUDED.partner_gender,
        must_condition = EXCLUDED.must_condition,
        mbti = EXCLUDED.mbti,
        budget_pref = EXCLUDED.budget_pref,
        purpose_tags = EXCLUDED.purpose_tags,
        demand_tags = EXCLUDED.demand_tags;

    -- =====================================
    -- 1. 文化系：京都清水寺
    -- =====================================
    INSERT INTO places (
        id,
        owner,
        genre,
        title,
        images,
        budget_option,
        purpose_tags,
        demand_tags,
        purpose_text,
        budget_min,
        budget_max,
        date_start,
        date_end,
        recruit_num,
        first_choice,
        second_choice,
        gmap_url,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        dummy_user_id,
        '歴史・文化',
        '京都清水寺の早朝参拝＆着物レンタル体験',
        ARRAY[
            'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop&crop=center'
        ],
        6, -- 15,000〜30,000円
        ARRAY[1, 3, 8], -- 観光、写真撮影、歴史・文化
        ARRAY[1, 2], -- 写真を撮ってくれる人、一緒に食事を楽しめる人
        '京都の清水寺を早朝6時から散策して、観光客が少ない静寂な時間を楽しみませんか？着物をレンタルして、京都らしい写真をたくさん撮りましょう！参拝後は近くの老舗で朝食を取り、二年坂・三年坂も散策予定です。京都の歴史と文化を一緒に感じられる方をお待ちしています。',
        8000,
        15000,
        CURRENT_DATE + INTERVAL '12 days',
        CURRENT_DATE + INTERVAL '13 days',
        2,
        '着物姿での写真撮影をお手伝いいただける方',
        '京都の歴史に興味がある方',
        'https://maps.google.com/maps?q=清水寺,京都',
        NOW() - INTERVAL '2 days'
    ) RETURNING id INTO place_id_1;

    -- =====================================
    -- 2. 自然系：沖縄美ら海水族館
    -- =====================================
    INSERT INTO places (
        id,
        owner,
        genre,
        title,
        images,
        budget_option,
        purpose_tags,
        demand_tags,
        purpose_text,
        budget_min,
        budget_max,
        date_start,
        date_end,
        recruit_num,
        first_choice,
        second_choice,
        gmap_url,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        dummy_user_id,
        '水族館・海',
        '沖縄美ら海水族館＆古宇利島ドライブ',
        ARRAY[
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1580540436903-93a84e3e89eb?w=800&h=600&fit=crop&crop=center'
        ],
        8, -- 50,000円〜
        ARRAY[1, 4, 7], -- 観光、アクティビティ、自然
        ARRAY[2, 6], -- 一緒に食事を楽しめる人、運転ができる人
        '沖縄の美ら海水族館でジンベエザメの迫力を体感した後、古宇利島までドライブしませんか？エメラルドグリーンの海を眺めながら、沖縄の自然を満喫しましょう！昼食は海を見ながら沖縄そばを、夕食は国際通りで本場の沖縄料理を楽しみたいです。レンタカーの運転を代わってもらえると助かります。',
        35000,
        50000,
        CURRENT_DATE + INTERVAL '25 days',
        CURRENT_DATE + INTERVAL '27 days',
        2,
        'レンタカー運転可能な方',
        '海の生き物・沖縄料理が好きな方',
        'https://maps.google.com/maps?q=沖縄美ら海水族館',
        NOW() - INTERVAL '1 day'
    ) RETURNING id INTO place_id_2;

    -- =====================================
    -- 3. グルメ系：大阪たこ焼き巡り
    -- =====================================
    INSERT INTO places (
        id,
        owner,
        genre,
        title,
        images,
        budget_option,
        purpose_tags,
        demand_tags,
        purpose_text,
        budget_min,
        budget_max,
        date_start,
        date_end,
        recruit_num,
        first_choice,
        second_choice,
        gmap_url,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        dummy_user_id,
        'グルメ',
        '大阪でたこ焼き＆お好み焼き名店巡り',
        ARRAY[
            'https://images.unsplash.com/photo-1606471191009-67eb537e5c2d?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1576385864360-c3a6af27f4a5?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop&crop=center'
        ],
        5, -- 5,000〜15,000円
        ARRAY[2, 1, 3], -- グルメ、観光、写真撮影
        ARRAY[2, 9], -- 一緒に食事を楽しめる人、話しやすい人
        '大阪の本場たこ焼きとお好み焼きを食べ歩きしませんか？道頓堀の老舗「たこ焼き山ちゃん」から始まり、地元の人しか知らない隠れた名店まで5店舗を巡る予定です。お好み焼きは「きじ」と「美津の」の食べ比べも！大阪のソウルフードを一緒に楽しみ、食べ歩きの写真もたくさん撮りましょう。',
        3000,
        8000,
        CURRENT_DATE + INTERVAL '8 days',
        CURRENT_DATE + INTERVAL '8 days',
        3,
        'よく食べる方・食べ歩きが好きな方',
        '関西弁に慣れている方',
        'https://maps.google.com/maps?q=道頓堀,大阪',
        NOW() - INTERVAL '4 hours'
    ) RETURNING id INTO place_id_3;

    -- =====================================
    -- 4. アクティブ系：富士山ハイキング
    -- =====================================
    INSERT INTO places (
        id,
        owner,
        genre,
        title,
        images,
        budget_option,
        purpose_tags,
        demand_tags,
        purpose_text,
        budget_min,
        budget_max,
        date_start,
        date_end,
        recruit_num,
        first_choice,
        second_choice,
        gmap_url,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        dummy_user_id,
        'アウトドア',
        '富士山五合目ハイキング＆河口湖温泉',
        ARRAY[
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1533651848520-2e5e7ca30b34?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop&crop=center'
        ],
        6, -- 15,000〜30,000円
        ARRAY[4, 7, 6], -- アクティビティ、自然、温泉・リラックス
        ARRAY[3, 4], -- 体力がある人、計画性がある人
        '富士山の五合目から六合目までのハイキングを楽しんで、その後河口湖温泉でリフレッシュしませんか？朝6時に新宿出発で、富士山の雄大な景色を楽しみながら約3時間のハイキング。下山後は河口湖温泉「富士レークホテル」の日帰り温泉で疲れを癒しましょう。体力に自信がある方、一緒に日本一の山を楽しみませんか？',
        12000,
        18000,
        CURRENT_DATE + INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '15 days',
        2,
        'ハイキング経験者・体力に自信がある方',
        '早起きが得意な方',
        'https://maps.google.com/maps?q=富士山五合目',
        NOW() - INTERVAL '6 hours'
    ) RETURNING id INTO place_id_4;

    -- =====================================
    -- 5. リラックス系：箱根温泉
    -- =====================================
    INSERT INTO places (
        id,
        owner,
        genre,
        title,
        images,
        budget_option,
        purpose_tags,
        demand_tags,
        purpose_text,
        budget_min,
        budget_max,
        date_start,
        date_end,
        recruit_num,
        first_choice,
        second_choice,
        gmap_url,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        dummy_user_id,
        '温泉',
        '箱根温泉巡り＆美術館で芸術鑑賞',
        ARRAY[
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=800&h=600&fit=crop&crop=center'
        ],
        6, -- 15,000〜30,000円
        ARRAY[6, 8, 1], -- 温泉・リラックス、歴史・文化、観光
        ARRAY[9, 10], -- 話しやすい人、時間に余裕がある人
        '箱根の温泉を巡りながら、のんびりとした時間を過ごしませんか？大涌谷の黒たまご、箱根神社の参拝、そして「箱根の森美術館」で芸術鑑賞を楽しみましょう。温泉は「天山湯治郷」の日帰り温泉で、露天風呂から箱根の自然を眺めながらリラックス。忙しい日常を忘れて、ゆったりとした時間を一緒に過ごせる方をお待ちしています。',
        10000,
        16000,
        CURRENT_DATE + INTERVAL '18 days',
        CURRENT_DATE + INTERVAL '18 days',
        2,
        '美術・芸術に興味がある方',
        'のんびり過ごすのが好きな方',
        'https://maps.google.com/maps?q=箱根温泉',
        NOW() - INTERVAL '30 minutes'
    ) RETURNING id INTO place_id_5;

    -- =====================================
    -- 完了メッセージ
    -- =====================================
    RAISE NOTICE '✅ ダミーデータ作成完了！';
    RAISE NOTICE '👤 ユーザープロフィール: 山田桜 (26歳女性)';
    RAISE NOTICE '📍 作成された場所:';
    RAISE NOTICE '  1. 京都清水寺 (文化系) - ID: %', place_id_1;
    RAISE NOTICE '  2. 沖縄美ら海水族館 (自然系) - ID: %', place_id_2;
    RAISE NOTICE '  3. 大阪たこ焼き巡り (グルメ系) - ID: %', place_id_3;
    RAISE NOTICE '  4. 富士山ハイキング (アクティブ系) - ID: %', place_id_4;
    RAISE NOTICE '  5. 箱根温泉 (リラックス系) - ID: %', place_id_5;
    
END $$;