import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';

describe('BlogsController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        appSetup(app); // не забываем подключить глобальные префиксы, пайпы
        await app.init();
    });

    afterAll(async () => {
        await request(app.getHttpServer()).delete('/testing/all-data');
        await app.close();
    });

    // Очищаем базу перед каждым тестом через специальный контроллер
    beforeEach(async () => {
        await request(app.getHttpServer()).delete('/testing/all-data');
    });

    it('should return 200 and paginated blogs storage', async () => {
        // 1. Сначала создадим блог, чтобы список не был пустым
        const createDto = {
            name: 'Test Blog',
            description: 'Test Description',
            websiteUrl: 'https://test.com',
        };

        await request(app.getHttpServer())
            .post('/blogs')
            .send(createDto)
            .expect(201);

        // 2. Делаем запрос на получение всех блогов
        const response = await request(app.getHttpServer())
            .get('/blogs')
            .expect(200);

        // 3. Проверяем структуру ответа (PaginatedViewDto)
        expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [
                {
                    id: expect.any(String), // ID генерирует база
                    name: createDto.name,
                    description: createDto.description,
                    websiteUrl: createDto.websiteUrl,
                    createdAt: expect.any(String), // Проверяем, что дата пришла строкой ISO
                    isMembership: false, // В createInstance у тебя забито true
                },
            ],
        });
    });

    it('sent empty query, should return 200 and paginated blogs storage with default query settings', async () => {
        // 1. Сначала создадим блог, чтобы список не был пустым
        const createDto_1 = {
            name: 'Test Blog 1',
            description: 'Test Description 1',
            websiteUrl: 'https://test1.com',
        };

        // заводим в базу первый блог
        await request(app.getHttpServer())
            .post('/blogs')
            .send(createDto_1)
            .expect(201);

        const createDto_2 = {
            name: 'Test Blog 2',
            description: 'Test Description 2',
            websiteUrl: 'https://test2.com',
        };

        // заводим в базу второй блог
        await request(app.getHttpServer())
            .post('/blogs')
            .send(createDto_2)
            .expect(201);

        // 2. Делаем запрос на получение всех блогов
        const response = await request(app.getHttpServer())
            .get('/blogs')
            .expect(200);

        // console.log(response.body.items[0].createdAt);
        // console.log(response.body.items[1].createdAt);

        // 3. Проверяем структуру ответа (PaginatedViewDto)
        expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 2,
            items: [
                {
                    id: expect.any(String), // ID генерирует база
                    name: createDto_2.name,
                    description: createDto_2.description,
                    websiteUrl: createDto_2.websiteUrl,
                    createdAt: expect.any(String), // Проверяем, что дата пришла строкой ISO
                    isMembership: false, // В createInstance у тебя забито true
                },
                {
                    id: expect.any(String), // ID генерирует база
                    name: createDto_1.name,
                    description: createDto_1.description,
                    websiteUrl: createDto_1.websiteUrl,
                    createdAt: expect.any(String), // Проверяем, что дата пришла строкой ISO
                    isMembership: false, // В createInstance у тебя забито true
                },
            ],
        });
    });

    it('should return empty pagination if no blogs exist', async () => {
        const response = await request(app.getHttpServer())
            .get('/blogs')
            .expect(200);

        expect(response.body).toEqual({
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: [],
        });
    });

    it('GET /blogs/:blogId/posts - should return 200 and paginated posts for specific blog', async () => {
        // 1. Создаем блог
        const createBlogResponse = await request(app.getHttpServer())
            .post('/blogs')
            .send({
                name: 'NodeJS Blog',
                description: 'Backend news',
                websiteUrl: 'https://nodejs.org',
            })
            .expect(201);

        const blog = createBlogResponse.body;

        // 2. Создаем пост для этого блога
        const createPostDto = {
            title: 'NestJS Testing',
            shortDescription: 'How to write e2e tests',
            content: 'Very long and useful content about supertest...',
        };

        const createPostResponse = await request(app.getHttpServer())
            .post(`/blogs/${blog.id}/posts`)
            .send(createPostDto)
            .expect(201);

        const createdPost = createPostResponse.body;

        /*
        {
        "id": "69f629a4b705ee0b0e4b874e",
        "name": "NodeJS Blog",
        "description": "Backend news",
        "websiteUrl": "https://nodejs.org",
        "createdAt": "2026-05-02T16:43:16.921Z",
        "isMembership": true
        }
         */
        // 3. Пытаемся получить посты этого блога
        const response = await request(app.getHttpServer())
            .get(`/blogs/${blog.id}/posts`)
            .expect(200);

        // 4. Проверяем структуру PaginatedViewDto<PostViewDto>
        expect(response.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 1,
            items: [
                {
                    id: createdPost.id,
                    title: createPostDto.title,
                    shortDescription: createPostDto.shortDescription,
                    content: createPostDto.content,
                    blogId: blog.id,
                    blogName: blog.name,
                    createdAt: expect.any(String),
                    extendedLikesInfo: {
                        likesCount: 0,
                        dislikesCount: 0,
                        myStatus: 'None',
                        newestLikes: [], // При создании нового поста лайков еще нет
                    },
                },
            ],
        });
    });

    it('should return 404 if blog does not exist', async () => {
        const fakeBlogId = '6633973977c688d054942944'; // Валидный ObjectId, но несуществующий

        await request(app.getHttpServer())
            .get(`/blogs/${fakeBlogId}/posts`)
            .expect(404);
    });

    it('POST /blogs/:blogId/posts -> should create post for blog and return 201', async () => {
        // 1. Сначала создаем блог, к которому будем привязывать пост
        const createBlogDto = {
            name: 'Blog for Post',
            description: 'Description',
            websiteUrl: 'https://test.com',
        };

        const blogResponse = await request(app.getHttpServer())
            .post('/blogs') // Проверь префикс  согласно своим настройкам
            .send(createBlogDto)
            .expect(201);

        const blog = blogResponse.body;

        // 2. Данные для создания поста
        const createPostDto = {
            title: 'New Post Title',
            shortDescription: 'Short desc for post',
            content: 'Content of the post',
        };

        // 3. Отправляем запрос на создание поста
        const response = await request(app.getHttpServer())
            .post(`/blogs/${blog.id}/posts`)
            .send(createPostDto)
            .expect(201);

        // 4. Проверяем структуру ответа
        expect(response.body).toEqual({
            id: expect.any(String),
            title: createPostDto.title,
            shortDescription: createPostDto.shortDescription,
            content: createPostDto.content,
            blogId: blog.id,
            blogName: blog.name, // Важно проверить, что имя подтянулось правильно
            createdAt: expect.any(String),
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: 'None',
                newestLikes: [], // При создании список лайков всегда пуст
            },
        });

        // 5. Дополнительно проверяем, что пост реально создался и доступен по GET
        await request(app.getHttpServer())
            .get(`/blogs/${blog.id}/posts`)
            .expect(200)
            .then((res) => {
                expect(res.body.items[0].id).toBe(response.body.id);
            });
    });

    it('POST /blogs/:blogId/posts -> should return 404 if blog does not exist', async () => {
        const fakeBlogId = '6633973977c688d054942944'; // Валидный по формату, но несуществующий ID

        const createPostDto = {
            title: 'Title',
            shortDescription: 'Desc',
            content: 'Content',
        };

        await request(app.getHttpServer())
            .post(`/blogs/${fakeBlogId}/posts`)
            .send(createPostDto)
            .expect(404);
    });

    it('POST /blogs/:blogId/posts -> should create post and return 201 with correct body', async () => {
        // 1. Создаем блог-родитель
        const createBlogDto = {
            name: 'Testing Blog',
            description: 'Testing post creation',
            websiteUrl: 'https://test-post.com',
        };

        const blogResponse = await request(app.getHttpServer())
            .post('/blogs')
            .send(createBlogDto)
            .expect(201);

        const blog = blogResponse.body;

        // 2. Данные для нового поста
        const createPostDto = {
            title: 'Interesting Post',
            shortDescription: 'Short description of the interesting post',
            content: 'Very detailed content about NodeJS',
        };

        // 3. Создаем пост через блог
        const response = await request(app.getHttpServer())
            .post(`/blogs/${blog.id}/posts`)
            .send(createPostDto)
            .expect(201);

        // 4. Проверяем структуру ответа (PostViewDto)
        expect(response.body).toEqual({
            id: expect.any(String),
            title: createPostDto.title,
            shortDescription: createPostDto.shortDescription,
            content: createPostDto.content,
            blogId: blog.id,
            blogName: blog.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: 'None',
                newestLikes: [],
            },
        });
    });

    // ЭТО ВАЛИДАЦИЯ
    // it('POST /blogs/:blogId/posts -> should return 400 if input data is incorrect', async () => {
    //     const blogResponse = await request(app.getHttpServer())
    //         .post('/blogs')
    //         .send({ name: 'Valid Name', description: 'Desc', websiteUrl: 'https://ok.com' });
    //
    //     const invalidPostDto = {
    //         title: '', // Пустой заголовок
    //         shortDescription: 'Too short',
    //         content: 'Content'
    //     };
    //
    //     await request(app.getHttpServer())
    //         .post(`/blogs/${blogResponse.body.id}/posts`)
    //         .send(invalidPostDto)
    //         .expect(400);
    // });

    it('GET /blogs/:id -> should return 200 and blog object', async () => {
        // 1. Создаем блог, который будем запрашивать
        const createBlogDto = {
            name: 'Target Blog',
            description: 'Get me by ID',
            websiteUrl: 'https://find-me.com',
        };

        const createResponse = await request(app.getHttpServer())
            .post('/blogs')
            .send(createBlogDto)
            .expect(201);

        const createdBlog = createResponse.body;

        // 2. Запрашиваем созданный блог по ID
        const response = await request(app.getHttpServer())
            .get(`/blogs/${createdBlog.id}`)
            .expect(200);

        // 3. Проверяем соответствие структуры и данных
        expect(response.body).toEqual({
            id: createdBlog.id,
            name: createBlogDto.name,
            description: createBlogDto.description,
            websiteUrl: createBlogDto.websiteUrl,
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
        });
    });

    it('GET /blogs/:id -> should return 404 if blog does not exist', async () => {
        const nonExistentId = '6633973977c688d054942944'; // Валидный ObjectId, которого нет в базе

        await request(app.getHttpServer())
            .get(`/blogs/${nonExistentId}`)
            .expect(404);
    });

    it('PUT /blogs/:id -> should update blog and return 204', async () => {
        // 1. Создаем блог
        const createResponse = await request(app.getHttpServer())
            .post('/blogs')
            .send({
                name: 'Old Name',
                description: 'Old Description',
                websiteUrl: 'https://old.com',
            })
            .expect(201);

        const blogId = createResponse.body.id;

        // 2. Обновляем его
        const updateDto = {
            name: 'New Name',
            description: 'New Description',
            websiteUrl: 'https://new.com',
        };

        await request(app.getHttpServer())
            .put(`/blogs/${blogId}`)
            .send(updateDto)
            .expect(204);

        // 3. Проверяем, что данные изменились
        const getResponse = await request(app.getHttpServer())
            .get(`/blogs/${blogId}`)
            .expect(200);

        expect(getResponse.body.name).toBe(updateDto.name);
        expect(getResponse.body.description).toBe(updateDto.description);
        expect(getResponse.body.websiteUrl).toBe(updateDto.websiteUrl);
    });

    it('PUT /blogs/:id -> should return 404 if blog not found', async () => {
        await request(app.getHttpServer())
            .put('/blogs/6633973977c688d054942944')
            .send({
                name: 'Name',
                description: 'Desc',
                websiteUrl: 'https://ok.com',
            })
            .expect(404);
    });

    it('DELETE /blogs/:id -> should delete blog and return 204', async () => {
        // 1. Создаем блог
        const createResponse = await request(app.getHttpServer())
            .post('/blogs')
            .send({
                name: 'Delete Me',
                description: 'To be deleted',
                websiteUrl: 'https://delete.com',
            })
            .expect(201);

        const blogId = createResponse.body.id;

        // 2. Удаляем блог
        await request(app.getHttpServer())
            .delete(`/blogs/${blogId}`)
            .expect(204);

        // Временная проверка: подождать 100мс
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 3. Пытаемся найти его по ID - должны получить 404
        await request(app.getHttpServer()).get(`/blogs/${blogId}`).expect(404);
    });

    it('DELETE /blogs/:id -> should return 404 if blog does not exist', async () => {
        await request(app.getHttpServer())
            .delete('/blogs/6633973977c688d054942944')
            .expect(404);
    });

    // GET -> "/blogs/:blogId/posts": create 6 posts then: like post 1 by user 1,
    // user 2; like post 2 by user 2, user 3; dislike post 3 by user 1;
    // like post 4 by user 1, user 4, user 2, user 3; like post 5 by user 2,
    // dislike by user 3; like post 6 by user 1, dislike by user 2.
    // Get the posts by user 1 after all likes NewestLikes should be sorted in
    // descending; status 200; content: posts array with pagination;
    // used additional methods: POST -> /blogs, POST -> /blogs/:blogId/posts,
    // PUT -> posts/:postId/like-status;
    it('GET /blogs/:blogId/posts - should return 200 and paginated posts for specific blog', async () => {
        // создание пользователя
        const user_1 = {
            login: 'qwerty1',
            password: 'lg-885081',
            email: 'example@example1.dev',
        };
        const user_2 = {
            login: 'qwerty2',
            password: 'lg-885082',
            email: 'example@example2.dev',
        };
        const user_3 = {
            login: 'qwerty3',
            password: 'lg-885083',
            email: 'example@example3.dev',
        };
        const login = 'admin';
        const password = 'qwerty';
        const authHeader =
            'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');

        const createUserResponse1 = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', authHeader)
            .send(user_1)
            .expect(201);

        const createUserResponse2 = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', authHeader)
            .send(user_2)
            .expect(201);

        const createUserResponse3 = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', authHeader)
            .send(user_3)
            .expect(201);

        // проверяем что юзер создался коректно
        expect(createUserResponse1.body).toEqual({
            id: expect.any(String),
            login: user_1.login,
            email: user_1.email,
            createdAt: expect.any(String),
        });

        // логиним созданного юзера
        const createAuthLoginResponse1 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ loginOrEmail: user_1.login, password: user_1.password })
            .expect(200);

        // {
        //     "accessToken" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMWM1YWM4ODdiNmFiNTlhYjg2ZDFmMiIsImlhdCI6MTc4MDI0MzE0NiwiZXhwIjoxNzgwMjQ2NzQ2fQ.jDyTdoIO-_KcGpM3pEQsDWvPLiME2TscR_7UK0H2-qk"
        // }

        // проверяем что нам вернулись рефреш токен и эксесс токен
        expect(createAuthLoginResponse1.body.accessToken).toBeDefined();
        expect(createAuthLoginResponse1.body.accessToken).toEqual(
            expect.any(String),
        );

        // проверяем, что массив заголовков set-cookie вообще существует
        expect(createAuthLoginResponse1.headers['set-cookie']).toBeDefined();

        // ищем нашу куку среди установленных кук
        const rawCookies = createAuthLoginResponse1.headers['set-cookie'];

        // Превращаем в массив в любом случае (если это была строка, оборачиваем в массив)
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        const refreshTokenCookie = cookies.find((cookie) =>
            cookie.includes('refreshToken'),
        );

        // кука с именем refreshToken была найдена
        expect(refreshTokenCookie).toBeDefined();

        // проверка флагов безопасности
        expect(refreshTokenCookie).toContain('refreshToken=');
        expect(refreshTokenCookie).toContain('HttpOnly');

        // логиним еще двух пользователей
        const createAuthLoginResponse2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ loginOrEmail: user_2.login, password: user_2.password })
            .expect(200);

        const createAuthLoginResponse3 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ loginOrEmail: user_3.login, password: user_3.password })
            .expect(200);

        // создание блога с использованием basic-authorisation
        const createBlogResponse = await request(app.getHttpServer())
            .post('/blogs')
            .set('Authorization', authHeader)
            .send({
                name: 'NodeJS Blog',
                description: 'Backend news',
                websiteUrl: 'https://nodejs.org',
            })
            .expect(201);

        const blog = createBlogResponse.body;
        // структура возвращаемого блога
        /*
        {
        "id": "69f629a4b705ee0b0e4b874e",
        "name": "NodeJS Blog",
        "description": "Backend news",
        "websiteUrl": "https://nodejs.org",
        "createdAt": "2026-05-02T16:43:16.921Z",
        "isMembership": true
        }
        */

        // создание поста для этого блога
        const createPostDto = {
            title: 'NestJS Testing',
            shortDescription: 'How to write e2e tests',
            content: 'Very long and useful content about supertest...',
            blogId: blog.id,
        };

        // console.log('ACCESS TOKEN: ', createAuthLoginResponse.body.accessToken);

        // с использованием basic-authorisation
        const createPostResponse = await request(app.getHttpServer())
            .post(`/blogs/${blog.id}/posts`)
            .set('Authorization', authHeader)
            .send(createPostDto)
            .expect(201);
        const createdPost = createPostResponse.body;
        // `Bearer ${createAuthLoginResponse.body.accessToken}`

        // лайкаем пост первым пользователем
        const createPostLike = await request(app.getHttpServer())
            .put(`/posts/${createdPost.id}/like-status`)
            .set(
                'Authorization',
                `Bearer ${createAuthLoginResponse1.body.accessToken}`,
            )
            .send({
                likeStatus: 'Like',
            })
            .expect(204);

        // лайкаем пост вторым пользователем
        const createPostLike2 = await request(app.getHttpServer())
            .put(`/posts/${createdPost.id}/like-status`)
            .set(
                'Authorization',
                `Bearer ${createAuthLoginResponse2.body.accessToken}`,
            )
            .send({
                likeStatus: 'Like',
            })
            .expect(204);

        // лайкаем пост третьим пользователем
        const createPostLike3 = await request(app.getHttpServer())
            .put(`/posts/${createdPost.id}/like-status`)
            .set(
                'Authorization',
                `Bearer ${createAuthLoginResponse3.body.accessToken}`,
            )
            .send({
                likeStatus: 'Dislike',
            })
            .expect(204);

        // проверяем состояние поста
        const result = await request(app.getHttpServer())
            .get(`/blogs/${blog.id}/posts`)
            .expect(200);

        // console.log(result.body);

        // т.к. обращались как анонимные то должен быть None
        expect(result.body.items[0].extendedLikesInfo.myStatus).toEqual('None');

        // проверяем состояние поста но уже с токеном от имени второго пользователя
        const resultWithToken = await request(app.getHttpServer())
            .get(`/blogs/${blog.id}/posts`)
            .set(
                'Authorization',
                `Bearer ${createAuthLoginResponse2.body.accessToken}`,
            )
            .expect(200);

        console.log(resultWithToken.body);
        console.log(resultWithToken.body.items[0].extendedLikesInfo);

        // т.к. обращались как залогиненый юзер то должен быть Like
        expect(
            resultWithToken.body.items[0].extendedLikesInfo.myStatus,
        ).toEqual('Like');

        // проверяем состояние поста но уже с токеном от имени третьего пользователя
        const resultWithToken2 = await request(app.getHttpServer())
            .get(`/blogs/${blog.id}/posts`)
            .set(
                'Authorization',
                `Bearer ${createAuthLoginResponse3.body.accessToken}`,
            )
            .expect(200);

        // т.к. обращались как залогиненый юзер то должен быть Like
        expect(
            resultWithToken2.body.items[0].extendedLikesInfo.myStatus,
        ).toEqual('Dislike');
    });
});
