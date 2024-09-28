import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "@/SocketContext";
import { Layout } from "./Layout";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"


export const Results = () => {

    const { socket } = useSocket();
    const { code } = useParams();

    const [places, setPlaces] = useState([])


    if(!socket){
        console.error('Socket is not initialized..');
        return;
    }

    useEffect(() => {

        // gets the results
        socket.on('getPlaces', (places) => {
            console.log(`Places: ${JSON.stringify(places,null, 1)}`);
            setPlaces(places);
        });

    }, [code, socket]);

    return (
        <Layout user={socket.auth.token} avatar={socket.auth.avatar}>
            <div className={"border w-full bg-gray-100 rounded-xl mx-auto p-4 shadow-md m-2 flex items-center justify-center "}>
                <Progress className={""} value={100} />
                <p className={"ml-1"}> 100% </p>
            </div>
            <div className={"w-auto bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>
                <Card x-chunk={"dashboard-06-chunk-0"}>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                            View restaurants near you and decide where to go.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table className={""}>
                            <TableCaption className={"text-left"}> A list of your recommendations</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={"hidden w-[100px] sm:table-cell"}>
                                        <span className={"sr-only"}>Image</span>
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Price Level</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {places.map((place) => (
                                    <TableRow key={place.place_id}>
                                        <TableCell className={"hidden sm:table-cell"}>
                                            <img alt={"location_img"} className={"aspect-square rounded-md object-cover"} height={"64"} src={"/create.jpg"} width={"64"}/>
                                        </TableCell>
                                        <TableCell className={"font-medium"}>{place.name}</TableCell>
                                        <TableCell>{place.formatted_address}</TableCell>
                                        <TableCell>{place.rating}</TableCell>
                                        <TableCell>{place.price_level}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>

                </Card>
            </div>
        </Layout>
    )
};
