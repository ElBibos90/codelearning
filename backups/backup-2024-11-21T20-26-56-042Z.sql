PGDMP  8                
    |            codelearning    17.1    17.1 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16552    codelearning    DATABASE        CREATE DATABASE codelearning WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Italian_Italy.1252';
    DROP DATABASE codelearning;
                     postgres    false                        2615    17369    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     postgres    false            �           0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                        postgres    false    5            �           0    0    SCHEMA public    ACL     Q   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
                        postgres    false    5            �           1247    17545    resource_type    TYPE     ]   CREATE TYPE public.resource_type AS ENUM (
    'pdf',
    'video',
    'link',
    'code'
);
     DROP TYPE public.resource_type;
       public               postgres    false    5            �            1255    17635    track_lesson_versions()    FUNCTION     9  CREATE FUNCTION public.track_lesson_versions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                IF (TG_OP = 'UPDATE' AND OLD.content <> NEW.content) THEN
                    -- Incrementa la versione
                    NEW.version = OLD.version + 1;
                    NEW.last_edited_at = CURRENT_TIMESTAMP;
                    
                    -- Salva la nuova versione
                    INSERT INTO lesson_versions (
                        lesson_id,
                        content,
                        content_format,
                        version,
                        created_by,
                        change_description
                    ) VALUES (
                        NEW.id,
                        NEW.content,
                        NEW.content_format,
                        NEW.version,
                        NEW.last_edited_by,
                        'Aggiornamento contenuto'
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$;
 .   DROP FUNCTION public.track_lesson_versions();
       public               postgres    false    5            �            1259    17370    comments    TABLE     V  CREATE TABLE public.comments (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    parent_id integer,
    is_deleted boolean DEFAULT false
);
    DROP TABLE public.comments;
       public         heap r       postgres    false    5            �            1259    17378    comments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.comments_id_seq;
       public               postgres    false    5    217            �           0    0    comments_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;
          public               postgres    false    218            �            1259    17379    course_enrollments    TABLE     
  CREATE TABLE public.course_enrollments (
    id integer NOT NULL,
    user_id integer,
    course_id integer,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone
);
 &   DROP TABLE public.course_enrollments;
       public         heap r       postgres    false    5            �            1259    17384    course_enrollments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.course_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.course_enrollments_id_seq;
       public               postgres    false    219    5            �           0    0    course_enrollments_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.course_enrollments_id_seq OWNED BY public.course_enrollments.id;
          public               postgres    false    220            �            1259    17385    courses    TABLE     '  CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    difficulty_level character varying(20),
    duration_hours integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT courses_difficulty_level_check CHECK (((difficulty_level)::text = ANY (ARRAY[('beginner'::character varying)::text, ('intermediate'::character varying)::text, ('advanced'::character varying)::text])))
);
    DROP TABLE public.courses;
       public         heap r       postgres    false    5            �            1259    17393    courses_id_seq    SEQUENCE     �   CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.courses_id_seq;
       public               postgres    false    221    5            �           0    0    courses_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;
          public               postgres    false    222            �            1259    17394 	   donations    TABLE     �  CREATE TABLE public.donations (
    id integer NOT NULL,
    transaction_id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) NOT NULL,
    message text,
    from_name character varying(255) NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    is_test boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.donations;
       public         heap r       postgres    false    5            �            1259    17401    donations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.donations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.donations_id_seq;
       public               postgres    false    223    5            �           0    0    donations_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.donations_id_seq OWNED BY public.donations.id;
          public               postgres    false    224            �            1259    18171    health_checks    TABLE     �   CREATE TABLE public.health_checks (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    report jsonb NOT NULL,
    status character varying(50) NOT NULL,
    duration integer
);
 !   DROP TABLE public.health_checks;
       public         heap r       postgres    false    5            �            1259    18170    health_checks_id_seq    SEQUENCE     �   CREATE SEQUENCE public.health_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.health_checks_id_seq;
       public               postgres    false    240    5            �           0    0    health_checks_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.health_checks_id_seq OWNED BY public.health_checks.id;
          public               postgres    false    239            �            1259    17402    lesson_progress    TABLE     2  CREATE TABLE public.lesson_progress (
    id integer NOT NULL,
    user_id integer,
    lesson_id integer,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_accessed timestamp with time zone
);
 #   DROP TABLE public.lesson_progress;
       public         heap r       postgres    false    5            �            1259    17407    lesson_progress_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.lesson_progress_id_seq;
       public               postgres    false    5    225            �           0    0    lesson_progress_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.lesson_progress_id_seq OWNED BY public.lesson_progress.id;
          public               postgres    false    226            �            1259    17554    lesson_resources    TABLE     �  CREATE TABLE public.lesson_resources (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    title character varying(255) NOT NULL,
    url text NOT NULL,
    description text,
    type public.resource_type DEFAULT 'link'::public.resource_type,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.lesson_resources;
       public         heap r       postgres    false    899    899    5            �            1259    17553    lesson_resources_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.lesson_resources_id_seq;
       public               postgres    false    5    234            �           0    0    lesson_resources_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.lesson_resources_id_seq OWNED BY public.lesson_resources.id;
          public               postgres    false    233            �            1259    17613    lesson_versions    TABLE     Y  CREATE TABLE public.lesson_versions (
    id integer NOT NULL,
    lesson_id integer,
    content text NOT NULL,
    content_format character varying(10) DEFAULT 'markdown'::character varying,
    version integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    change_description text
);
 #   DROP TABLE public.lesson_versions;
       public         heap r       postgres    false    5            �            1259    17612    lesson_versions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.lesson_versions_id_seq;
       public               postgres    false    236    5            �           0    0    lesson_versions_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.lesson_versions_id_seq OWNED BY public.lesson_versions.id;
          public               postgres    false    235            �            1259    17408    lessons    TABLE     _  CREATE TABLE public.lessons (
    id integer NOT NULL,
    course_id integer,
    title character varying(255) NOT NULL,
    content text,
    order_number integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    video_url text,
    content_format character varying(10) DEFAULT 'markdown'::character varying,
    content_preview text,
    meta_description text,
    estimated_minutes integer DEFAULT 30,
    version integer DEFAULT 1,
    last_edited_at timestamp with time zone,
    last_edited_by integer,
    status character varying(20) DEFAULT 'draft'::character varying,
    published_at timestamp with time zone,
    CONSTRAINT lessons_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'review'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);
    DROP TABLE public.lessons;
       public         heap r       postgres    false    5            �            1259    17414    lessons_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.lessons_id_seq;
       public               postgres    false    5    227            �           0    0    lessons_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;
          public               postgres    false    228            �            1259    18181    maintenance_logs    TABLE       CREATE TABLE public.maintenance_logs (
    id integer NOT NULL,
    job_name character varying(50) NOT NULL,
    success boolean NOT NULL,
    duration numeric,
    error_message text,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    details jsonb
);
 $   DROP TABLE public.maintenance_logs;
       public         heap r       postgres    false    5            �            1259    18180    maintenance_logs_id_seq    SEQUENCE     �   CREATE SEQUENCE public.maintenance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.maintenance_logs_id_seq;
       public               postgres    false    242    5            �           0    0    maintenance_logs_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.maintenance_logs_id_seq OWNED BY public.maintenance_logs.id;
          public               postgres    false    241            �            1259    18161 
   migrations    TABLE     �   CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.migrations;
       public         heap r       postgres    false    5            �            1259    18160    migrations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.migrations_id_seq;
       public               postgres    false    238    5            �           0    0    migrations_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;
          public               postgres    false    237            �            1259    17415    user_preferences    TABLE     �  CREATE TABLE public.user_preferences (
    user_id integer NOT NULL,
    notification_email boolean DEFAULT true,
    preferred_difficulty character varying(20) DEFAULT 'beginner'::character varying,
    theme character varying(20) DEFAULT 'light'::character varying,
    language character varying(10) DEFAULT 'it'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.user_preferences;
       public         heap r       postgres    false    5            �            1259    17424    user_profiles    TABLE     �  CREATE TABLE public.user_profiles (
    user_id integer NOT NULL,
    full_name character varying(255),
    bio text,
    avatar_url text,
    linkedin_url text,
    github_url text,
    website_url text,
    skills text[],
    interests text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 !   DROP TABLE public.user_profiles;
       public         heap r       postgres    false    5            �            1259    17431    users    TABLE     k  CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone
);
    DROP TABLE public.users;
       public         heap r       postgres    false    5            �            1259    17438    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    231    5            �           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    232            �           2604    17439    comments id    DEFAULT     j   ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);
 :   ALTER TABLE public.comments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217            �           2604    17440    course_enrollments id    DEFAULT     ~   ALTER TABLE ONLY public.course_enrollments ALTER COLUMN id SET DEFAULT nextval('public.course_enrollments_id_seq'::regclass);
 D   ALTER TABLE public.course_enrollments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    219            �           2604    17441 
   courses id    DEFAULT     h   ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);
 9   ALTER TABLE public.courses ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    221            �           2604    17442    donations id    DEFAULT     l   ALTER TABLE ONLY public.donations ALTER COLUMN id SET DEFAULT nextval('public.donations_id_seq'::regclass);
 ;   ALTER TABLE public.donations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223            �           2604    18174    health_checks id    DEFAULT     t   ALTER TABLE ONLY public.health_checks ALTER COLUMN id SET DEFAULT nextval('public.health_checks_id_seq'::regclass);
 ?   ALTER TABLE public.health_checks ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    240    240            �           2604    17443    lesson_progress id    DEFAULT     x   ALTER TABLE ONLY public.lesson_progress ALTER COLUMN id SET DEFAULT nextval('public.lesson_progress_id_seq'::regclass);
 A   ALTER TABLE public.lesson_progress ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225            �           2604    17557    lesson_resources id    DEFAULT     z   ALTER TABLE ONLY public.lesson_resources ALTER COLUMN id SET DEFAULT nextval('public.lesson_resources_id_seq'::regclass);
 B   ALTER TABLE public.lesson_resources ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    233    234    234            �           2604    17616    lesson_versions id    DEFAULT     x   ALTER TABLE ONLY public.lesson_versions ALTER COLUMN id SET DEFAULT nextval('public.lesson_versions_id_seq'::regclass);
 A   ALTER TABLE public.lesson_versions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    236    236            �           2604    17444 
   lessons id    DEFAULT     h   ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);
 9   ALTER TABLE public.lessons ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227            �           2604    18184    maintenance_logs id    DEFAULT     z   ALTER TABLE ONLY public.maintenance_logs ALTER COLUMN id SET DEFAULT nextval('public.maintenance_logs_id_seq'::regclass);
 B   ALTER TABLE public.maintenance_logs ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    242    242            �           2604    18164    migrations id    DEFAULT     n   ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);
 <   ALTER TABLE public.migrations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    237    238    238            �           2604    17445    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231            �          0    17370    comments 
   TABLE DATA           r   COPY public.comments (id, lesson_id, user_id, content, created_at, updated_at, parent_id, is_deleted) FROM stdin;
    public               postgres    false    217   ��       �          0    17379    course_enrollments 
   TABLE DATA           j   COPY public.course_enrollments (id, user_id, course_id, enrolled_at, completed, completed_at) FROM stdin;
    public               postgres    false    219   ն       �          0    17385    courses 
   TABLE DATA           s   COPY public.courses (id, title, description, difficulty_level, duration_hours, created_at, updated_at) FROM stdin;
    public               postgres    false    221   �       �          0    17394 	   donations 
   TABLE DATA           �   COPY public.donations (id, transaction_id, email, amount, currency, message, from_name, "timestamp", is_test, created_at) FROM stdin;
    public               postgres    false    223   ��       �          0    18171    health_checks 
   TABLE DATA           R   COPY public.health_checks (id, "timestamp", report, status, duration) FROM stdin;
    public               postgres    false    240   ��       �          0    17402    lesson_progress 
   TABLE DATA           u   COPY public.lesson_progress (id, user_id, lesson_id, completed, completed_at, created_at, last_accessed) FROM stdin;
    public               postgres    false    225   z�       �          0    17554    lesson_resources 
   TABLE DATA           p   COPY public.lesson_resources (id, lesson_id, title, url, description, type, created_at, updated_at) FROM stdin;
    public               postgres    false    234   Ϲ       �          0    17613    lesson_versions 
   TABLE DATA           �   COPY public.lesson_versions (id, lesson_id, content, content_format, version, created_at, created_by, change_description) FROM stdin;
    public               postgres    false    236   �       �          0    17408    lessons 
   TABLE DATA           �   COPY public.lessons (id, course_id, title, content, order_number, created_at, video_url, content_format, content_preview, meta_description, estimated_minutes, version, last_edited_at, last_edited_by, status, published_at) FROM stdin;
    public               postgres    false    227   	�       �          0    18181    maintenance_logs 
   TABLE DATA           p   COPY public.maintenance_logs (id, job_name, success, duration, error_message, executed_at, details) FROM stdin;
    public               postgres    false    242   x�       �          0    18161 
   migrations 
   TABLE DATA           ;   COPY public.migrations (id, name, executed_at) FROM stdin;
    public               postgres    false    238   �       �          0    17415    user_preferences 
   TABLE DATA           �   COPY public.user_preferences (user_id, notification_email, preferred_difficulty, theme, language, created_at, updated_at) FROM stdin;
    public               postgres    false    229   7�       �          0    17424    user_profiles 
   TABLE DATA           �   COPY public.user_profiles (user_id, full_name, bio, avatar_url, linkedin_url, github_url, website_url, skills, interests, created_at, updated_at) FROM stdin;
    public               postgres    false    230   T�       �          0    17431    users 
   TABLE DATA           X   COPY public.users (id, name, email, password, role, created_at, last_login) FROM stdin;
    public               postgres    false    231   q�                   0    0    comments_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.comments_id_seq', 1, false);
          public               postgres    false    218                       0    0    course_enrollments_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.course_enrollments_id_seq', 4, true);
          public               postgres    false    220                       0    0    courses_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.courses_id_seq', 9, true);
          public               postgres    false    222                       0    0    donations_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.donations_id_seq', 1, false);
          public               postgres    false    224                       0    0    health_checks_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.health_checks_id_seq', 7, true);
          public               postgres    false    239                       0    0    lesson_progress_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.lesson_progress_id_seq', 39, true);
          public               postgres    false    226                       0    0    lesson_resources_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.lesson_resources_id_seq', 2, true);
          public               postgres    false    233                       0    0    lesson_versions_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.lesson_versions_id_seq', 1, false);
          public               postgres    false    235                       0    0    lessons_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.lessons_id_seq', 7, true);
          public               postgres    false    228            	           0    0    maintenance_logs_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.maintenance_logs_id_seq', 52, true);
          public               postgres    false    241            
           0    0    migrations_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);
          public               postgres    false    237                       0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 12, true);
          public               postgres    false    232            �           2606    17447    comments comments_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_pkey;
       public                 postgres    false    217            �           2606    17449 *   course_enrollments course_enrollments_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_pkey;
       public                 postgres    false    219                       2606    17451 ;   course_enrollments course_enrollments_user_id_course_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_course_id_key UNIQUE (user_id, course_id);
 e   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_user_id_course_id_key;
       public                 postgres    false    219    219                       2606    17453    courses courses_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.courses DROP CONSTRAINT courses_pkey;
       public                 postgres    false    221                       2606    17455    donations donations_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.donations DROP CONSTRAINT donations_pkey;
       public                 postgres    false    223                       2606    17457 &   donations donations_transaction_id_key 
   CONSTRAINT     k   ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_transaction_id_key UNIQUE (transaction_id);
 P   ALTER TABLE ONLY public.donations DROP CONSTRAINT donations_transaction_id_key;
       public                 postgres    false    223            *           2606    18179     health_checks health_checks_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.health_checks
    ADD CONSTRAINT health_checks_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.health_checks DROP CONSTRAINT health_checks_pkey;
       public                 postgres    false    240                       2606    17459 $   lesson_progress lesson_progress_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_pkey;
       public                 postgres    false    225                       2606    17461 5   lesson_progress lesson_progress_user_id_lesson_id_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
 _   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_user_id_lesson_id_key;
       public                 postgres    false    225    225                        2606    17564 &   lesson_resources lesson_resources_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT lesson_resources_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT lesson_resources_pkey;
       public                 postgres    false    234            "           2606    17624 5   lesson_versions lesson_versions_lesson_id_version_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_lesson_id_version_key UNIQUE (lesson_id, version);
 _   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_lesson_id_version_key;
       public                 postgres    false    236    236            $           2606    17622 $   lesson_versions lesson_versions_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_pkey;
       public                 postgres    false    236                       2606    17463 *   lessons lessons_course_id_order_number_key 
   CONSTRAINT     x   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_order_number_key UNIQUE (course_id, order_number);
 T   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_course_id_order_number_key;
       public                 postgres    false    227    227                       2606    17465    lessons lessons_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_pkey;
       public                 postgres    false    227            0           2606    18189 &   maintenance_logs maintenance_logs_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.maintenance_logs DROP CONSTRAINT maintenance_logs_pkey;
       public                 postgres    false    242            &           2606    18169    migrations migrations_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.migrations DROP CONSTRAINT migrations_name_key;
       public                 postgres    false    238            (           2606    18167    migrations migrations_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.migrations DROP CONSTRAINT migrations_pkey;
       public                 postgres    false    238                       2606    17467 &   user_preferences user_preferences_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);
 P   ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT user_preferences_pkey;
       public                 postgres    false    229                       2606    17469     user_profiles user_profiles_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);
 J   ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_pkey;
       public                 postgres    false    230                       2606    17471    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    231                       2606    17473    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    231            �           1259    17474    idx_comments_lesson_id    INDEX     P   CREATE INDEX idx_comments_lesson_id ON public.comments USING btree (lesson_id);
 *   DROP INDEX public.idx_comments_lesson_id;
       public                 postgres    false    217            �           1259    17475    idx_comments_parent_id    INDEX     P   CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);
 *   DROP INDEX public.idx_comments_parent_id;
       public                 postgres    false    217            �           1259    17476    idx_comments_user_id    INDEX     L   CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);
 (   DROP INDEX public.idx_comments_user_id;
       public                 postgres    false    217                       1259    17477    idx_donations_is_test    INDEX     N   CREATE INDEX idx_donations_is_test ON public.donations USING btree (is_test);
 )   DROP INDEX public.idx_donations_is_test;
       public                 postgres    false    223            	           1259    17478    idx_donations_timestamp    INDEX     T   CREATE INDEX idx_donations_timestamp ON public.donations USING btree ("timestamp");
 +   DROP INDEX public.idx_donations_timestamp;
       public                 postgres    false    223            +           1259    18191    idx_health_checks_status    INDEX     T   CREATE INDEX idx_health_checks_status ON public.health_checks USING btree (status);
 ,   DROP INDEX public.idx_health_checks_status;
       public                 postgres    false    240            ,           1259    18190    idx_health_checks_timestamp    INDEX     \   CREATE INDEX idx_health_checks_timestamp ON public.health_checks USING btree ("timestamp");
 /   DROP INDEX public.idx_health_checks_timestamp;
       public                 postgres    false    240            
           1259    17577 !   idx_lesson_progress_last_accessed    INDEX     f   CREATE INDEX idx_lesson_progress_last_accessed ON public.lesson_progress USING btree (last_accessed);
 5   DROP INDEX public.idx_lesson_progress_last_accessed;
       public                 postgres    false    225                       1259    17576    idx_lesson_progress_user_lesson    INDEX     i   CREATE INDEX idx_lesson_progress_user_lesson ON public.lesson_progress USING btree (user_id, lesson_id);
 3   DROP INDEX public.idx_lesson_progress_user_lesson;
       public                 postgres    false    225    225                       1259    17575    idx_lesson_resources_lesson_id    INDEX     `   CREATE INDEX idx_lesson_resources_lesson_id ON public.lesson_resources USING btree (lesson_id);
 2   DROP INDEX public.idx_lesson_resources_lesson_id;
       public                 postgres    false    234                       1259    17611    idx_lessons_course_order    INDEX     _   CREATE INDEX idx_lessons_course_order ON public.lessons USING btree (course_id, order_number);
 ,   DROP INDEX public.idx_lessons_course_order;
       public                 postgres    false    227    227                       1259    17610    idx_lessons_status    INDEX     H   CREATE INDEX idx_lessons_status ON public.lessons USING btree (status);
 &   DROP INDEX public.idx_lessons_status;
       public                 postgres    false    227            -           1259    18193     idx_maintenance_logs_executed_at    INDEX     d   CREATE INDEX idx_maintenance_logs_executed_at ON public.maintenance_logs USING btree (executed_at);
 4   DROP INDEX public.idx_maintenance_logs_executed_at;
       public                 postgres    false    242            .           1259    18192    idx_maintenance_logs_job_name    INDEX     ^   CREATE INDEX idx_maintenance_logs_job_name ON public.maintenance_logs USING btree (job_name);
 1   DROP INDEX public.idx_maintenance_logs_job_name;
       public                 postgres    false    242            @           2620    17636    lessons lessons_version_tracker    TRIGGER     �   CREATE TRIGGER lessons_version_tracker BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.track_lesson_versions();
 8   DROP TRIGGER lessons_version_tracker ON public.lessons;
       public               postgres    false    227    243            1           2606    17479     comments comments_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_lesson_id_fkey;
       public               postgres    false    4885    217    227            2           2606    17484     comments comments_parent_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE SET NULL;
 J   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_parent_id_fkey;
       public               postgres    false    4858    217    217            3           2606    17489    comments comments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 H   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_user_id_fkey;
       public               postgres    false    4893    217    231            4           2606    17494 4   course_enrollments course_enrollments_course_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_course_id_fkey;
       public               postgres    false    221    4867    219            5           2606    17499 2   course_enrollments course_enrollments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_user_id_fkey;
       public               postgres    false    231    219    4893            <           2606    17570    lesson_resources fk_lesson    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT fk_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 D   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT fk_lesson;
       public               postgres    false    4885    234    227            6           2606    17504 .   lesson_progress lesson_progress_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_lesson_id_fkey;
       public               postgres    false    227    225    4885            7           2606    17509 ,   lesson_progress lesson_progress_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_user_id_fkey;
       public               postgres    false    231    225    4893            =           2606    17565 0   lesson_resources lesson_resources_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT lesson_resources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 Z   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT lesson_resources_lesson_id_fkey;
       public               postgres    false    4885    227    234            >           2606    17630 /   lesson_versions lesson_versions_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
 Y   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_created_by_fkey;
       public               postgres    false    236    4893    231            ?           2606    17625 .   lesson_versions lesson_versions_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_lesson_id_fkey;
       public               postgres    false    236    4885    227            8           2606    17514    lessons lessons_course_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
 H   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_course_id_fkey;
       public               postgres    false    227    4867    221            9           2606    17603 #   lessons lessons_last_edited_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_last_edited_by_fkey FOREIGN KEY (last_edited_by) REFERENCES public.users(id);
 M   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_last_edited_by_fkey;
       public               postgres    false    231    227    4893            :           2606    17519 .   user_preferences user_preferences_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
       public               postgres    false    231    229    4893            ;           2606    17524 (   user_profiles user_profiles_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
       public               postgres    false    4893    231    230            �      x������ � �      �   3   x�3�4�4�4202�54�54S04�20�26ҳ0233��L������� �}�      �   {   x�E�1!@�N1X°˂�@[cg�H�$:�Y���je��j�C�����2�+�P��P�l����hЫ@�B�2R�z#�*
�r�-����Y�..��"8�|L��1̫>���%�      �      x������ � �      �   �  x����j�0 �s����
�h���SO��u�6Pۡ�KKɻw�m6&F�r�G��1�a����
�_��C�C��ކشE�z/�mܴ?�D��6�sU�۱z�ÚÒ_ۦ�ߪqSf��в���:��';T�Ǧz���9�M�2��T�ﺦ�hW}�#������:���K�cSH1�}��)Ԇ�j=��t��n����jsv�M�G�[�/}W�u�n��ج������-9YYa=��^h�� Ë��g{�3^��^�0�R�^��V *��r�RXo���r�����2_
r�E�^�DR��J+�����l/:�.�uP�x��\�,��z)������������0�2'^(K����8祤d�7{\��A�M�쉗��O���5��-�\<���=�3\tY����x/���go�      �   E   x�=ɱ�0��p�JCx���(M��H	�<��Й��A������^����e]�y8t�����}      �      x������ � �      �      x������ � �      �   _   x�3�4�(�/K4�)�KLK)OL+N��/�J���Z(ZZ����Xp��q�&e����@dl �a�%�� \1z\\\ �;^      �   �  x���r�@��W���"�vI�R�T�7��b�S*> �i�rD�==]���G~, H=(Q$dK�ϭ�L���{�� �I���������'��1�c�FXN��pQL8V�G����"�w�ѝI(�JS�%�c��X��s5�)B3wݕ��ƶe
Qi�̒i/ܑ�t����WE^ܻ��|n6���Lwv|�����r�	�!*�3w�T�U�xt�o�FꇻZ�Y���p-�����-	q[bM�n��eb�I4�$��&�!�fi*Mt�%��6��"ns$�ݖX�v���&�E�QBܦXe�`"q���%a>S)Er��nk�Z������r�6���n������R*�a*NG3��L���4C���6��"n3��Ѹ'����LGZr�Y�m4��ә�*#�y��"(�Z�H�q�m�^=�՘�T���F��n�A�9�(����4E���I�&R�Ts�i������L���\��m�Ƙ�@���}I.��&h�p��Ī�Xe8I��1G��$6&Mm��K��-�9}�F��B8�����j�mQ�㈴ܶ�:K�g6��̌I씞�t�2%b"�nKu������1��v[ߔ_��,�&�W�����l�d=�N&�E�J"�N�O��ޭ�%�#ED��!����z:_ƙ=��0����t]���ChD��eq'qi��Y��T-�x�lՔ�ѧ?9'֥u���j������g�Q����\��B�سoX&����}ug���*�|�Ƕ͓��X�?M��*��>�������N�>���c���]��0m�����m�Ԇ����MWLS��MǙÿ������j��Y^��#:<�\����[�w݇�S<�31��"�4��j���?lB3u�XG�0���hQ� �y1��:���b|Ю06Om��ߛl�+�*M8�w���	��l��|þ㫹��_�j���?�3�(�-~������j�-�v:�b�����u�-��?��ZV��f��܉A�j�/W�Y9�|�Ee�Wy�e���� ���h�8�{�~|��Av�,m.Z���`���X�و�Q�`TK�0#a"����2͋ٲ���4�X��v�n��ch;@��E3�������t_��d��AŁ@�%�%e;G�I�Rp[J�,�z���~���ؖ0����Y�-�I������^K�p�uJ�fq�S5H�)��ܴ��W�������?L��sE\��M.�8첃 ,���qZ`q,������Ǖ�wX���}t%_��hx�62��~bо�N�_�`Fd�t�\3Um�87;�Ϯɇ�|�f�Q-f�9��ky���jd緵��;��L}�;�ێ��v��f�J~�������|��h�\���B�4d��WZwu�l����/�J�d�WҲ��xp߾ZG뚲�b/�����⏮4ǎ�ZG���#�WI���\t��;��4N�E�4s�uQ�θ��_1J�jҕ�]��/W����q���w�k�	��f�R�| �)��r�^�~.���4=���u�,������G����.=:.6:����</.�Eם�.`�j�j�\M/uAp�y���������V���$ɗ�?�U��ȼңe���h)���ޞ�N���IJ;򯭦��ϯ��n��[��2J��H;.�~lm*]qϿ�l|9�=�bz�Z�uG)�M0�0Ɗ��j9�*�ʕ+��B��r�jiؖ��P���S����U�r/�B�Z�����T�9E��Rj�O�U�\n���k墿V�q`�܇L���m�r(�C�J�P*�R9�ʡT�}�R9�ʡT�r(�C�J�g��r(�C���/�˳~X�'�.e��T���_6X*��T�[
�+�u��_��h�]A�w�C}���Y��5q�/P�(p>�j,%	Y��QW���F�+D䑑B��E��V���Hr�'�Ų�￣�eY��?2��_�+3������������,��,��Q2_����Z�E��{���0|�pKz��OuAJ��*���[Q
�x�R��_�kH)|�(�����R$�R �xǔBw�R � J�(P
�@)�R � J��.� J��[����	u��Gx�G)������O)X�I���[���a�)��h�� �B	�?K#�6�5��q� 9�r,qЮYu���0RES�m$�F��m�ڼ��R�Ʌ(׍	���2���+ϛ�L��	�5�"a��h��.��.?�{t��e[G�0�@��(�_�x�x� C��nB~�0D�C|�(���n�i������0$����r�Q��g��Q@k�qG6 ��pH�8p��!�C�%�!�C � 8pȀ�!�!��еU���Q&�]�!�4	�߈E(�u �x���#��l�N{8���\��薆-�C<��T�> �BQ�?�3*�8`����Pc�^��:o$>�H)&��Hu�����F]m$	"�i��r�X�N �r|�tJx9����S�*I�x�æ�[������%[xD����9"�M�6��m=70��wX�a�ؘJ>0�\�:7�X�����<B�*|d$ZW�g���[#�:g$�X��o%�w��� /�=^>�y��0v�_�%���=k1~3�����PC�t��4tn���
0`(�P�� C���0�5� �z�N`(�P�� C��R~��
DM�0I�4�}5��8b~����x��[����4.��N�� θ	�V���(T��+9Ft��X!<��V�6�3lTA����a�p#��F�k��Ua,tg%rh�8�m�_�BOIx�g-��붙|ߋ�5��aWg����`�B��&�i�X`� @�}��N"D� "@D��ti"�}@D�� 9u�D� "oID>IDhG1�M���m���#���qCDD�wCDN,$"u��VFBi�?�`��V^)�,���#���S獤gɈ��I�򰍑$dO?�S�d�H�>�bD�p�i,_�D:%��0~.�p���vyr���Չ�X!������0ׁ�M|�  @d@�  " D �  @�  " " D�7������6j�Bcڳ_ƄF�l��#�nV���ҧy��nTT�"|����Ddo_$B�$p_$/����P��(TE�*
UQ��BU��P��(TE�*
UQ��BUtU�__U�ct{{�l�h�      �      x������ � �      �      x������ � �      �      x������ � �      �   �   x�e�1��0��|
V��-�$�#h<$R$@�N��_�-�۞��� �Y](=���Ϲ�cZ��Ģ��AS�Q�qŚ���~�y��4o�|w����3s��۩>�L���D~E���%Ԝ���)s 0X� st	4��_4��dکB寈�W�������vJ�
�bd^vx|\׽���R�ty��r�v���t
%]`�,�~.XӴ_��NT     