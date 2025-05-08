export const testDatabaseConfig = {
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT!, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME_TEST || 'hairypaws_test',
  entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema: true,
};
