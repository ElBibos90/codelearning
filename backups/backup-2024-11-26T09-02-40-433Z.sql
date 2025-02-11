PGDMP  (        
        
    |            codelearning    17.1    17.1 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    41788    codelearning    DATABASE        CREATE DATABASE codelearning WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Italian_Italy.1252';
    DROP DATABASE codelearning;
                     postgres    false                        2615    2200    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     postgres    false            �           0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                        postgres    false    5            �           0    0    SCHEMA public    ACL     Q   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
                        postgres    false    5            j           1247    41790    resource_type    TYPE     ]   CREATE TYPE public.resource_type AS ENUM (
    'pdf',
    'video',
    'link',
    'code'
);
     DROP TYPE public.resource_type;
       public               postgres    false    5            �            1255    41799    track_lesson_versions()    FUNCTION     9  CREATE FUNCTION public.track_lesson_versions() RETURNS trigger
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
       public               postgres    false    5            �            1259    41800    comments    TABLE     V  CREATE TABLE public.comments (
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
       public         heap r       postgres    false    5            �            1259    41808    comments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.comments_id_seq;
       public               postgres    false    217    5            �           0    0    comments_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;
          public               postgres    false    218            �            1259    41809    course_enrollments    TABLE     
  CREATE TABLE public.course_enrollments (
    id integer NOT NULL,
    user_id integer,
    course_id integer,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone
);
 &   DROP TABLE public.course_enrollments;
       public         heap r       postgres    false    5            �            1259    41814    course_enrollments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.course_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.course_enrollments_id_seq;
       public               postgres    false    5    219            �           0    0    course_enrollments_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.course_enrollments_id_seq OWNED BY public.course_enrollments.id;
          public               postgres    false    220            �            1259    59880    course_favorites    TABLE     �   CREATE TABLE public.course_favorites (
    id integer NOT NULL,
    user_id integer,
    course_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.course_favorites;
       public         heap r       postgres    false    5            �            1259    59879    course_favorites_id_seq    SEQUENCE     �   CREATE SEQUENCE public.course_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.course_favorites_id_seq;
       public               postgres    false    244    5            �           0    0    course_favorites_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.course_favorites_id_seq OWNED BY public.course_favorites.id;
          public               postgres    false    243            �            1259    41815    courses    TABLE     '  CREATE TABLE public.courses (
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
       public         heap r       postgres    false    5            �            1259    41823    courses_id_seq    SEQUENCE     �   CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.courses_id_seq;
       public               postgres    false    221    5            �           0    0    courses_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;
          public               postgres    false    222            �            1259    41824 	   donations    TABLE     �  CREATE TABLE public.donations (
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
       public         heap r       postgres    false    5            �            1259    41831    donations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.donations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.donations_id_seq;
       public               postgres    false    223    5            �           0    0    donations_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.donations_id_seq OWNED BY public.donations.id;
          public               postgres    false    224            �            1259    41832    health_checks    TABLE     �   CREATE TABLE public.health_checks (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    report jsonb NOT NULL,
    status character varying(50) NOT NULL,
    duration integer
);
 !   DROP TABLE public.health_checks;
       public         heap r       postgres    false    5            �            1259    41838    health_checks_id_seq    SEQUENCE     �   CREATE SEQUENCE public.health_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.health_checks_id_seq;
       public               postgres    false    5    225            �           0    0    health_checks_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.health_checks_id_seq OWNED BY public.health_checks.id;
          public               postgres    false    226            �            1259    41839    lesson_progress    TABLE     2  CREATE TABLE public.lesson_progress (
    id integer NOT NULL,
    user_id integer,
    lesson_id integer,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_accessed timestamp with time zone
);
 #   DROP TABLE public.lesson_progress;
       public         heap r       postgres    false    5            �            1259    41844    lesson_progress_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.lesson_progress_id_seq;
       public               postgres    false    5    227            �           0    0    lesson_progress_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.lesson_progress_id_seq OWNED BY public.lesson_progress.id;
          public               postgres    false    228            �            1259    41845    lesson_resources    TABLE     �  CREATE TABLE public.lesson_resources (
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
       public         heap r       postgres    false    874    5    874            �            1259    41853    lesson_resources_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.lesson_resources_id_seq;
       public               postgres    false    5    229            �           0    0    lesson_resources_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.lesson_resources_id_seq OWNED BY public.lesson_resources.id;
          public               postgres    false    230            �            1259    41854    lesson_versions    TABLE     Y  CREATE TABLE public.lesson_versions (
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
       public         heap r       postgres    false    5            �            1259    41861    lesson_versions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lesson_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.lesson_versions_id_seq;
       public               postgres    false    231    5            �           0    0    lesson_versions_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.lesson_versions_id_seq OWNED BY public.lesson_versions.id;
          public               postgres    false    232            �            1259    41862    lessons    TABLE     u  CREATE TABLE public.lessons (
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
    CONSTRAINT lessons_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('review'::character varying)::text, ('published'::character varying)::text, ('archived'::character varying)::text])))
);
    DROP TABLE public.lessons;
       public         heap r       postgres    false    5            �            1259    41873    lessons_id_seq    SEQUENCE     �   CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.lessons_id_seq;
       public               postgres    false    233    5            �           0    0    lessons_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;
          public               postgres    false    234            �            1259    41874    maintenance_logs    TABLE       CREATE TABLE public.maintenance_logs (
    id integer NOT NULL,
    job_name character varying(50) NOT NULL,
    success boolean NOT NULL,
    duration numeric,
    error_message text,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    details jsonb
);
 $   DROP TABLE public.maintenance_logs;
       public         heap r       postgres    false    5            �            1259    41880    maintenance_logs_id_seq    SEQUENCE     �   CREATE SEQUENCE public.maintenance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.maintenance_logs_id_seq;
       public               postgres    false    5    235            �           0    0    maintenance_logs_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.maintenance_logs_id_seq OWNED BY public.maintenance_logs.id;
          public               postgres    false    236            �            1259    41881 
   migrations    TABLE     �   CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.migrations;
       public         heap r       postgres    false    5            �            1259    41885    migrations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.migrations_id_seq;
       public               postgres    false    237    5            �           0    0    migrations_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;
          public               postgres    false    238            �            1259    41886    user_preferences    TABLE     �  CREATE TABLE public.user_preferences (
    user_id integer NOT NULL,
    notification_email boolean DEFAULT true,
    preferred_difficulty character varying(20) DEFAULT 'beginner'::character varying,
    theme character varying(20) DEFAULT 'light'::character varying,
    language character varying(10) DEFAULT 'it'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.user_preferences;
       public         heap r       postgres    false    5            �            1259    41895    user_profiles    TABLE     �  CREATE TABLE public.user_profiles (
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
       public         heap r       postgres    false    5            �            1259    41902    users    TABLE     k  CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone
);
    DROP TABLE public.users;
       public         heap r       postgres    false    5            �            1259    41909    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    5    241            �           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    242            i           2604    41910    comments id    DEFAULT     j   ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);
 :   ALTER TABLE public.comments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217            m           2604    41911    course_enrollments id    DEFAULT     ~   ALTER TABLE ONLY public.course_enrollments ALTER COLUMN id SET DEFAULT nextval('public.course_enrollments_id_seq'::regclass);
 D   ALTER TABLE public.course_enrollments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    219            �           2604    59883    course_favorites id    DEFAULT     z   ALTER TABLE ONLY public.course_favorites ALTER COLUMN id SET DEFAULT nextval('public.course_favorites_id_seq'::regclass);
 B   ALTER TABLE public.course_favorites ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    244    243    244            p           2604    41912 
   courses id    DEFAULT     h   ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);
 9   ALTER TABLE public.courses ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    221            s           2604    41913    donations id    DEFAULT     l   ALTER TABLE ONLY public.donations ALTER COLUMN id SET DEFAULT nextval('public.donations_id_seq'::regclass);
 ;   ALTER TABLE public.donations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223            v           2604    41914    health_checks id    DEFAULT     t   ALTER TABLE ONLY public.health_checks ALTER COLUMN id SET DEFAULT nextval('public.health_checks_id_seq'::regclass);
 ?   ALTER TABLE public.health_checks ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225            x           2604    41915    lesson_progress id    DEFAULT     x   ALTER TABLE ONLY public.lesson_progress ALTER COLUMN id SET DEFAULT nextval('public.lesson_progress_id_seq'::regclass);
 A   ALTER TABLE public.lesson_progress ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227            {           2604    41916    lesson_resources id    DEFAULT     z   ALTER TABLE ONLY public.lesson_resources ALTER COLUMN id SET DEFAULT nextval('public.lesson_resources_id_seq'::regclass);
 B   ALTER TABLE public.lesson_resources ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229                       2604    41917    lesson_versions id    DEFAULT     x   ALTER TABLE ONLY public.lesson_versions ALTER COLUMN id SET DEFAULT nextval('public.lesson_versions_id_seq'::regclass);
 A   ALTER TABLE public.lesson_versions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231            �           2604    41918 
   lessons id    DEFAULT     h   ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);
 9   ALTER TABLE public.lessons ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233            �           2604    41919    maintenance_logs id    DEFAULT     z   ALTER TABLE ONLY public.maintenance_logs ALTER COLUMN id SET DEFAULT nextval('public.maintenance_logs_id_seq'::regclass);
 B   ALTER TABLE public.maintenance_logs ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    236    235            �           2604    41920    migrations id    DEFAULT     n   ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);
 <   ALTER TABLE public.migrations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    238    237            �           2604    41921    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    242    241            �          0    41800    comments 
   TABLE DATA           r   COPY public.comments (id, lesson_id, user_id, content, created_at, updated_at, parent_id, is_deleted) FROM stdin;
    public               postgres    false    217   )�       �          0    41809    course_enrollments 
   TABLE DATA           j   COPY public.course_enrollments (id, user_id, course_id, enrolled_at, completed, completed_at) FROM stdin;
    public               postgres    false    219   F�       �          0    59880    course_favorites 
   TABLE DATA           U   COPY public.course_favorites (id, user_id, course_id, notes, created_at) FROM stdin;
    public               postgres    false    244   c�       �          0    41815    courses 
   TABLE DATA           s   COPY public.courses (id, title, description, difficulty_level, duration_hours, created_at, updated_at) FROM stdin;
    public               postgres    false    221   ��       �          0    41824 	   donations 
   TABLE DATA           �   COPY public.donations (id, transaction_id, email, amount, currency, message, from_name, "timestamp", is_test, created_at) FROM stdin;
    public               postgres    false    223   ��       �          0    41832    health_checks 
   TABLE DATA           R   COPY public.health_checks (id, "timestamp", report, status, duration) FROM stdin;
    public               postgres    false    225   �       �          0    41839    lesson_progress 
   TABLE DATA           u   COPY public.lesson_progress (id, user_id, lesson_id, completed, completed_at, created_at, last_accessed) FROM stdin;
    public               postgres    false    227   ��       �          0    41845    lesson_resources 
   TABLE DATA           p   COPY public.lesson_resources (id, lesson_id, title, url, description, type, created_at, updated_at) FROM stdin;
    public               postgres    false    229   ��       �          0    41854    lesson_versions 
   TABLE DATA           �   COPY public.lesson_versions (id, lesson_id, content, content_format, version, created_at, created_by, change_description) FROM stdin;
    public               postgres    false    231   �       �          0    41862    lessons 
   TABLE DATA           �   COPY public.lessons (id, course_id, title, content, order_number, created_at, video_url, content_format, content_preview, meta_description, estimated_minutes, version, last_edited_at, last_edited_by, status, published_at) FROM stdin;
    public               postgres    false    233   ,�       �          0    41874    maintenance_logs 
   TABLE DATA           p   COPY public.maintenance_logs (id, job_name, success, duration, error_message, executed_at, details) FROM stdin;
    public               postgres    false    235   I�       �          0    41881 
   migrations 
   TABLE DATA           ;   COPY public.migrations (id, name, executed_at) FROM stdin;
    public               postgres    false    237   f�       �          0    41886    user_preferences 
   TABLE DATA           �   COPY public.user_preferences (user_id, notification_email, preferred_difficulty, theme, language, created_at, updated_at) FROM stdin;
    public               postgres    false    239   ��       �          0    41895    user_profiles 
   TABLE DATA           �   COPY public.user_profiles (user_id, full_name, bio, avatar_url, linkedin_url, github_url, website_url, skills, interests, created_at, updated_at) FROM stdin;
    public               postgres    false    240   ��       �          0    41902    users 
   TABLE DATA           X   COPY public.users (id, name, email, password, role, created_at, last_login) FROM stdin;
    public               postgres    false    241   ��       �           0    0    comments_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.comments_id_seq', 1, false);
          public               postgres    false    218            �           0    0    course_enrollments_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.course_enrollments_id_seq', 1, false);
          public               postgres    false    220            �           0    0    course_favorites_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.course_favorites_id_seq', 1, false);
          public               postgres    false    243            �           0    0    courses_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.courses_id_seq', 1, false);
          public               postgres    false    222            �           0    0    donations_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.donations_id_seq', 14, true);
          public               postgres    false    224            �           0    0    health_checks_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.health_checks_id_seq', 7, true);
          public               postgres    false    226            �           0    0    lesson_progress_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.lesson_progress_id_seq', 1, false);
          public               postgres    false    228            �           0    0    lesson_resources_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.lesson_resources_id_seq', 1, false);
          public               postgres    false    230            �           0    0    lesson_versions_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.lesson_versions_id_seq', 1, false);
          public               postgres    false    232            �           0    0    lessons_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.lessons_id_seq', 1, false);
          public               postgres    false    234            �           0    0    maintenance_logs_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.maintenance_logs_id_seq', 1, false);
          public               postgres    false    236            �           0    0    migrations_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);
          public               postgres    false    238            �           0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 1, false);
          public               postgres    false    242            �           2606    41923    comments comments_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_pkey;
       public                 postgres    false    217            �           2606    41925 *   course_enrollments course_enrollments_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_pkey;
       public                 postgres    false    219            �           2606    41927 ;   course_enrollments course_enrollments_user_id_course_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_course_id_key UNIQUE (user_id, course_id);
 e   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_user_id_course_id_key;
       public                 postgres    false    219    219            �           2606    59888 &   course_favorites course_favorites_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.course_favorites
    ADD CONSTRAINT course_favorites_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.course_favorites DROP CONSTRAINT course_favorites_pkey;
       public                 postgres    false    244            �           2606    59890 7   course_favorites course_favorites_user_id_course_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.course_favorites
    ADD CONSTRAINT course_favorites_user_id_course_id_key UNIQUE (user_id, course_id);
 a   ALTER TABLE ONLY public.course_favorites DROP CONSTRAINT course_favorites_user_id_course_id_key;
       public                 postgres    false    244    244            �           2606    41929    courses courses_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.courses DROP CONSTRAINT courses_pkey;
       public                 postgres    false    221            �           2606    41931    donations donations_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.donations DROP CONSTRAINT donations_pkey;
       public                 postgres    false    223            �           2606    41933 &   donations donations_transaction_id_key 
   CONSTRAINT     k   ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_transaction_id_key UNIQUE (transaction_id);
 P   ALTER TABLE ONLY public.donations DROP CONSTRAINT donations_transaction_id_key;
       public                 postgres    false    223            �           2606    41935     health_checks health_checks_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.health_checks
    ADD CONSTRAINT health_checks_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.health_checks DROP CONSTRAINT health_checks_pkey;
       public                 postgres    false    225            �           2606    41937 $   lesson_progress lesson_progress_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_pkey;
       public                 postgres    false    227            �           2606    41939 5   lesson_progress lesson_progress_user_id_lesson_id_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
 _   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_user_id_lesson_id_key;
       public                 postgres    false    227    227            �           2606    41941 &   lesson_resources lesson_resources_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT lesson_resources_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT lesson_resources_pkey;
       public                 postgres    false    229            �           2606    41943 5   lesson_versions lesson_versions_lesson_id_version_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_lesson_id_version_key UNIQUE (lesson_id, version);
 _   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_lesson_id_version_key;
       public                 postgres    false    231    231            �           2606    41945 $   lesson_versions lesson_versions_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_pkey;
       public                 postgres    false    231            �           2606    41947 *   lessons lessons_course_id_order_number_key 
   CONSTRAINT     x   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_order_number_key UNIQUE (course_id, order_number);
 T   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_course_id_order_number_key;
       public                 postgres    false    233    233            �           2606    41949    lessons lessons_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_pkey;
       public                 postgres    false    233            �           2606    41951 &   maintenance_logs maintenance_logs_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.maintenance_logs DROP CONSTRAINT maintenance_logs_pkey;
       public                 postgres    false    235            �           2606    41953    migrations migrations_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.migrations DROP CONSTRAINT migrations_name_key;
       public                 postgres    false    237            �           2606    41955    migrations migrations_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.migrations DROP CONSTRAINT migrations_pkey;
       public                 postgres    false    237            �           2606    41957 &   user_preferences user_preferences_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);
 P   ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT user_preferences_pkey;
       public                 postgres    false    239            �           2606    41959     user_profiles user_profiles_pkey 
   CONSTRAINT     c   ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);
 J   ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_pkey;
       public                 postgres    false    240            �           2606    41961    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    241            �           2606    41963    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    241            �           1259    41964    idx_comments_lesson_id    INDEX     P   CREATE INDEX idx_comments_lesson_id ON public.comments USING btree (lesson_id);
 *   DROP INDEX public.idx_comments_lesson_id;
       public                 postgres    false    217            �           1259    41965    idx_comments_parent_id    INDEX     P   CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);
 *   DROP INDEX public.idx_comments_parent_id;
       public                 postgres    false    217            �           1259    41966    idx_comments_user_id    INDEX     L   CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);
 (   DROP INDEX public.idx_comments_user_id;
       public                 postgres    false    217            �           1259    68283    idx_courses_created_at    INDEX     U   CREATE INDEX idx_courses_created_at ON public.courses USING btree (created_at DESC);
 *   DROP INDEX public.idx_courses_created_at;
       public                 postgres    false    221            �           1259    68284    idx_courses_id_asc    INDEX     D   CREATE INDEX idx_courses_id_asc ON public.courses USING btree (id);
 &   DROP INDEX public.idx_courses_id_asc;
       public                 postgres    false    221            �           1259    41967    idx_donations_is_test    INDEX     N   CREATE INDEX idx_donations_is_test ON public.donations USING btree (is_test);
 )   DROP INDEX public.idx_donations_is_test;
       public                 postgres    false    223            �           1259    41968    idx_donations_timestamp    INDEX     T   CREATE INDEX idx_donations_timestamp ON public.donations USING btree ("timestamp");
 +   DROP INDEX public.idx_donations_timestamp;
       public                 postgres    false    223            �           1259    68286    idx_enrollments_user_course    INDEX     h   CREATE INDEX idx_enrollments_user_course ON public.course_enrollments USING btree (user_id, course_id);
 /   DROP INDEX public.idx_enrollments_user_course;
       public                 postgres    false    219    219            �           1259    59902    idx_favorites_course    INDEX     V   CREATE INDEX idx_favorites_course ON public.course_favorites USING btree (course_id);
 (   DROP INDEX public.idx_favorites_course;
       public                 postgres    false    244            �           1259    59901    idx_favorites_user    INDEX     R   CREATE INDEX idx_favorites_user ON public.course_favorites USING btree (user_id);
 &   DROP INDEX public.idx_favorites_user;
       public                 postgres    false    244            �           1259    41969    idx_health_checks_status    INDEX     T   CREATE INDEX idx_health_checks_status ON public.health_checks USING btree (status);
 ,   DROP INDEX public.idx_health_checks_status;
       public                 postgres    false    225            �           1259    41970    idx_health_checks_timestamp    INDEX     \   CREATE INDEX idx_health_checks_timestamp ON public.health_checks USING btree ("timestamp");
 /   DROP INDEX public.idx_health_checks_timestamp;
       public                 postgres    false    225            �           1259    41971 !   idx_lesson_progress_last_accessed    INDEX     f   CREATE INDEX idx_lesson_progress_last_accessed ON public.lesson_progress USING btree (last_accessed);
 5   DROP INDEX public.idx_lesson_progress_last_accessed;
       public                 postgres    false    227            �           1259    41972    idx_lesson_progress_user_lesson    INDEX     i   CREATE INDEX idx_lesson_progress_user_lesson ON public.lesson_progress USING btree (user_id, lesson_id);
 3   DROP INDEX public.idx_lesson_progress_user_lesson;
       public                 postgres    false    227    227            �           1259    41973    idx_lesson_resources_lesson_id    INDEX     `   CREATE INDEX idx_lesson_resources_lesson_id ON public.lesson_resources USING btree (lesson_id);
 2   DROP INDEX public.idx_lesson_resources_lesson_id;
       public                 postgres    false    229            �           1259    68285    idx_lessons_course_created    INDEX     d   CREATE INDEX idx_lessons_course_created ON public.lessons USING btree (course_id, created_at DESC);
 .   DROP INDEX public.idx_lessons_course_created;
       public                 postgres    false    233    233            �           1259    41974    idx_lessons_course_order    INDEX     _   CREATE INDEX idx_lessons_course_order ON public.lessons USING btree (course_id, order_number);
 ,   DROP INDEX public.idx_lessons_course_order;
       public                 postgres    false    233    233            �           1259    41975    idx_lessons_status    INDEX     H   CREATE INDEX idx_lessons_status ON public.lessons USING btree (status);
 &   DROP INDEX public.idx_lessons_status;
       public                 postgres    false    233            �           1259    41976     idx_maintenance_logs_executed_at    INDEX     d   CREATE INDEX idx_maintenance_logs_executed_at ON public.maintenance_logs USING btree (executed_at);
 4   DROP INDEX public.idx_maintenance_logs_executed_at;
       public                 postgres    false    235            �           1259    41977    idx_maintenance_logs_job_name    INDEX     ^   CREATE INDEX idx_maintenance_logs_job_name ON public.maintenance_logs USING btree (job_name);
 1   DROP INDEX public.idx_maintenance_logs_job_name;
       public                 postgres    false    235            �           2620    41978    lessons lessons_version_tracker    TRIGGER     �   CREATE TRIGGER lessons_version_tracker BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.track_lesson_versions();
 8   DROP TRIGGER lessons_version_tracker ON public.lessons;
       public               postgres    false    245    233            �           2606    41979     comments comments_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_lesson_id_fkey;
       public               postgres    false    217    233    4806            �           2606    41984     comments comments_parent_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE SET NULL;
 J   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_parent_id_fkey;
       public               postgres    false    217    217    4764            �           2606    41989    comments comments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 H   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_user_id_fkey;
       public               postgres    false    217    241    4822            �           2606    41994 4   course_enrollments course_enrollments_course_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_course_id_fkey;
       public               postgres    false    219    221    4774            �           2606    41999 2   course_enrollments course_enrollments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.course_enrollments DROP CONSTRAINT course_enrollments_user_id_fkey;
       public               postgres    false    241    4822    219            �           2606    59896 0   course_favorites course_favorites_course_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_favorites
    ADD CONSTRAINT course_favorites_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
 Z   ALTER TABLE ONLY public.course_favorites DROP CONSTRAINT course_favorites_course_id_fkey;
       public               postgres    false    244    221    4774            �           2606    59891 .   course_favorites course_favorites_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.course_favorites
    ADD CONSTRAINT course_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.course_favorites DROP CONSTRAINT course_favorites_user_id_fkey;
       public               postgres    false    4822    244    241            �           2606    42004    lesson_resources fk_lesson    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT fk_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 D   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT fk_lesson;
       public               postgres    false    233    4806    229            �           2606    42009 .   lesson_progress lesson_progress_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_lesson_id_fkey;
       public               postgres    false    227    233    4806            �           2606    42014 ,   lesson_progress lesson_progress_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.lesson_progress DROP CONSTRAINT lesson_progress_user_id_fkey;
       public               postgres    false    241    227    4822            �           2606    42019 0   lesson_resources lesson_resources_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_resources
    ADD CONSTRAINT lesson_resources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 Z   ALTER TABLE ONLY public.lesson_resources DROP CONSTRAINT lesson_resources_lesson_id_fkey;
       public               postgres    false    229    233    4806            �           2606    42024 /   lesson_versions lesson_versions_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
 Y   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_created_by_fkey;
       public               postgres    false    241    231    4822            �           2606    42029 .   lesson_versions lesson_versions_lesson_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT lesson_versions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.lesson_versions DROP CONSTRAINT lesson_versions_lesson_id_fkey;
       public               postgres    false    233    231    4806            �           2606    42034    lessons lessons_course_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
 H   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_course_id_fkey;
       public               postgres    false    221    4774    233            �           2606    42039 #   lessons lessons_last_edited_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_last_edited_by_fkey FOREIGN KEY (last_edited_by) REFERENCES public.users(id);
 M   ALTER TABLE ONLY public.lessons DROP CONSTRAINT lessons_last_edited_by_fkey;
       public               postgres    false    233    241    4822            �           2606    42044 .   user_preferences user_preferences_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
       public               postgres    false    239    241    4822            �           2606    42049 (   user_profiles user_profiles_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
       public               postgres    false    241    4822    240            �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �   n   x�3�q�	r��742�L��K,��ϋ/I-.qH�H�-�I�K���44�30�t�J)�Bx.�y�E�FF&����F�
�VF&V�zFfF�ff�ix$�b���� O'$�      �   �  x����j�0 �s����
�h���SO��u�6Pۡ�KKɻw�m6&F�r�G��1�a����
�_��C�C��ކشE�z/�mܴ?�D��6�sU�۱z�ÚÒ_ۦ�ߪqSf��в���:��';T�Ǧz���9�M�2��T�ﺦ�hW}�#������:���K�cSH1�}��)Ԇ�j=��t��n����jsv�M�G�[�/}W�u�n��ج������-9YYa=��^h�� Ë��g{�3^��^�0�R�^��V *��r�RXo���r�����2_
r�E�^�DR��J+�����l/:�.�uP�x��\�,��z)������������0�2'^(K����8祤d�7{\��A�M�쉗��O���5��-�\<���=�3\tY����x/���go�      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �     