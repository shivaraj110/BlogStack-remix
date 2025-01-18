import { useUser } from "@clerk/remix"
import { prisma } from "./db"

export const setCollabTrue = (id:string) => {
    const user = useUser()
    prisma.user.update({
        where : {
            identifier : id
        },
        data : {
            openToCollab : true
        }
    })
    return true
}
export const setCollabFalse = (id:string) => {
    const user = useUser()
    prisma.user.update({
        where : {
            identifier : id
        },
        data : {
            openToCollab : true
        }
    })
    return false
}