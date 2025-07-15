-- Dummy Data for Journey App
-- テスト用のダミーデータ挿入スクリプト

-- =====================================
-- 1. ダミーユーザーの作成
-- =====================================
-- 注意: Supabaseのauth.usersテーブルは通常、認証フローで自動作成されます
-- 実際のテストでは、アプリから認証を行ってからこのプロフィールを作成してください

-- ダミーユーザーID（実際の認証後に置き換えてください）
-- 例: 認証後に取得したユーザーIDを使用
-- このスクリプトを実行する前に、認証を完了させてから実際のユーザーIDに置き換えてください

DO $$
DECLARE
    dummy_user_id UUID;
    place_id_1 UUID;
    place_id_2 UUID;
    place_id_3 UUID;
    place_id_4 UUID;
    place_id_5 UUID;
BEGIN
    -- 実際のユーザーIDを取得（最初に認証したユーザー）
    SELECT id INTO dummy_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- ユーザーが存在しない場合はスキップ
    IF dummy_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please sign up first, then run this script.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using user ID: %', dummy_user_id;

    -- =====================================
    -- 2. ダミーユーザープロフィールの作成
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
        'テスト太郎',
        'male',
        28,
        'either',
        '旅行が大好きで、新しい場所を探索するのが趣味です。写真撮影も得意で、一緒に思い出を作りましょう！',
        'ENFP',
        ARRAY[1, 2], -- 低・中予算
        ARRAY[1, 2, 3], -- 観光、グルメ、写真撮影
        ARRAY[1, 2], -- 写真を撮ってくれる人、一緒に食事を楽しめる人
        NOW() - INTERVAL '7 days'
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
    -- 3. ダミー場所データの作成
    -- =====================================
    
    -- 場所1: 京都の清水寺
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
        '観光地',
        '京都の清水寺で朝の散策',
        ARRAY[
            'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop'
        ],
        2, -- 中予算
        ARRAY[1, 3, 7], -- 観光、写真撮影、自然
        ARRAY[1, 2], -- 写真を撮ってくれる人、一緒に食事を楽しめる人
        '早朝の清水寺を散策して、人が少ない時間帯に美しい写真を撮影しましょう。その後、周辺の伝統的な朝食スポットで京都の味を楽しみたいと思います。',
        8000,
        15000,
        CURRENT_DATE + INTERVAL '10 days',
        CURRENT_DATE + INTERVAL '12 days',
        2,
        '写真撮影が好きな方',
        '京都の歴史に興味がある方',
        'https://maps.google.com/maps?q=清水寺',
        NOW() - INTERVAL '2 days'
    ) RETURNING id INTO place_id_1;

    -- 場所2: 沖縄の美ら海水族館
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
        '水族館',
        '沖縄美ら海水族館でジンベエザメを見よう',
        ARRAY[
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&h=400&fit=crop'
        ],
        3, -- 高予算
        ARRAY[1, 4, 7], -- 観光、アクティビティ、自然
        ARRAY[2, 3], -- 一緒に食事を楽しめる人、体力がある人
        '沖縄の美ら海水族館でジンベエザメの迫力を体感しましょう！その後はオーシャンビューのカフェで沖縄料理を楽しみたいです。',
        25000,
        40000,
        CURRENT_DATE + INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '22 days',
        3,
        '海洋生物に興味がある方',
        '沖縄料理を一緒に楽しめる方',
        'https://maps.google.com/maps?q=沖縄美ら海水族館',
        NOW() - INTERVAL '1 day'
    ) RETURNING id INTO place_id_2;

    -- 場所3: 北海道のラベンダー畑
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
        '自然',
        '富良野のラベンダー畑で写真撮影',
        ARRAY[
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=600&h=400&fit=crop'
        ],
        2, -- 中予算
        ARRAY[3, 6, 7], -- 写真撮影、温泉・リラックス、自然
        ARRAY[1, 4], -- 写真を撮ってくれる人、計画性がある人
        '北海道富良野のラベンダー畑で、紫色の絨毯のような景色を撮影しましょう。夕方の柔らかい光が特に美しいです。',
        12000,
        20000,
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '32 days',
        2,
        'カメラに詳しい方',
        '自然が好きな方',
        'https://maps.google.com/maps?q=富良野ラベンダー畑',
        NOW() - INTERVAL '3 hours'
    ) RETURNING id INTO place_id_3;

    -- 場所4: 東京スカイツリー
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
        '観光地',
        '東京スカイツリーで夜景を楽しもう',
        ARRAY[
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606918801925-e2c914c4b503?w=600&h=400&fit=crop'
        ],
        2, -- 中予算
        ARRAY[1, 3, 2], -- 観光、写真撮影、グルメ
        ARRAY[1, 2], -- 写真を撮ってくれる人、一緒に食事を楽しめる人
        '東京スカイツリーの展望台から東京の夜景を楽しみましょう。その後、ソラマチで美味しいディナーを一緒に！',
        5000,
        12000,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '7 days',
        2,
        '夜景撮影が好きな方',
        '東京のグルメスポットに詳しい方',
        'https://maps.google.com/maps?q=東京スカイツリー',
        NOW() - INTERVAL '5 hours'
    ) RETURNING id INTO place_id_4;

    -- 場所5: 箱根の温泉
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
        '箱根の温泉でリフレッシュ',
        ARRAY[
            'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop'
        ],
        2, -- 中予算
        ARRAY[6, 7, 8], -- 温泉・リラックス、自然、歴史・文化
        ARRAY[9, 10], -- 話しやすい人、時間に余裕がある人
        '箱根の温泉でゆっくりリフレッシュしませんか？日帰りでも十分楽しめる温泉スポットを巡りましょう。',
        8000,
        15000,
        CURRENT_DATE + INTERVAL '14 days',
        CURRENT_DATE + INTERVAL '14 days',
        3,
        '温泉好きの方',
        'のんびり過ごせる方',
        'https://maps.google.com/maps?q=箱根温泉',
        NOW() - INTERVAL '1 hour'
    ) RETURNING id INTO place_id_5;

    -- =====================================
    -- 4. サンプルリアクション（他のユーザーからの反応をシミュレート）
    -- =====================================
    -- 注意: 実際のテストでは、別のユーザーアカウントでログインしてリアクションを付けてください
    
    RAISE NOTICE 'Created dummy data successfully!';
    RAISE NOTICE 'Places created: %, %, %, %, %', place_id_1, place_id_2, place_id_3, place_id_4, place_id_5;
    RAISE NOTICE 'Profile created for user: %', dummy_user_id;
    
END $$;