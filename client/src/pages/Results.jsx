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
                <h1 className={"text-center font-bold p-2"}>Recommended Places</h1>
                <Card x-chunk={"dashboard-06-chunk-0"}>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                            View restaurants near you and decide where to go.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table className={""}>
                            <TableCaption> A list of your recommendations</TableCaption>
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

                    </CardFooter>

                </Card>
            </div>
        </Layout>
    )
};

// <div className="places-list mx-auto flex justify-center">
//     <ul>
//         {places.map((place) => (
//             <li>
//                 <div key={place.place_id} className="place-item">
//                     <h2>{place.name}</h2>
//                     <div className={"text-sm"}>
//                         <p>{place.formatted_address}</p>
//                         <p>Rating: {place.rating}</p>
//                         <p>Price Level: {place.price_level}</p>
//                         <br/>
//                     </div>
//                 </div>
//             </li>
//         ))}
//     </ul>
//
// </div>

{/*<div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>*/}
{/*    <h1 className={"text-center"}>Recommended Places</h1>*/}
{/*    <ul className={"flex justify-center"}>*/}
{/*        <li className={"space-y-2"}>*/}
{/*            <h2>name</h2>*/}
{/*            <p>rating</p>*/}
{/*            <p>price level</p>*/}
{/*            <p>address</p>*/}
{/*            <p>hours</p>*/}
{/*            <p>image</p>*/}
{/*        </li>*/}
{/*    </ul>*/}
{/*</div>*/}