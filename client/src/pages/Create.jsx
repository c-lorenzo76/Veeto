import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CirclePlus } from "lucide-react";


export const Create = () => {
    return (
        <div className="flex flex-col justify-center min-h-screen items-center bg-gray-100">
            <Card className="w-full max-w-sm bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-5xl flex justify-center  ">
                        Create
                    </CardTitle>
                    <CardDescription className="items-center">
                        Enter your name below to be displayed to others.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Name</Label>
                        <Input id="name" type="name" placeholder="Neo" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Create poll</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
