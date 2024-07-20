import { RedisPixelRepository } from '../repositories/RedisPixelRepository';
import { PixelService } from '../services/PixelService';


class SingletonPixelService {
    private static instance: SingletonPixelService;
    private pixelService: PixelService;

    private constructor() {
        const redisRepository = new RedisPixelRepository();
        this.pixelService = new PixelService(redisRepository);
    }

    public static getInstance(): SingletonPixelService {
        if (!SingletonPixelService.instance) {
        SingletonPixelService.instance = new SingletonPixelService();
        }
        return SingletonPixelService.instance;
    }

    public getPixelService(): PixelService {
        return this.pixelService;
    }
}

export default SingletonPixelService;