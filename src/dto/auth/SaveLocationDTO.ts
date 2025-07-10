import {z} from 'zod'
export const saveLocationSchema=z.object({
    userId:z.string(),
    location:z.object({
    lat:z.number().min(-90).max(90),
    lng:z.number().min(-180).max(180)
})
})
export type SaveLocationDTO=z.infer<typeof saveLocationSchema> 