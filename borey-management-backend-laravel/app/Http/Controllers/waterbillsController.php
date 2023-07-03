<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Validator;
use App\Models\User_info;
use App\Http\Resources\WaterbillsResource;
use App\Models\waterbills;
use App\Models\Role;
use App\Models\User;


class waterbillsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $user = auth()->user();

        // Check if the authenticated user is a company
        if ($user->role->name === Role::COMPANY) {
            $data = waterbills::latest()->get();
        } else {
            $data = waterbills::where('user_id', $user->user_id)->latest()->get();
        }

        return response($data, 200);
        // return response()->json([WaterbillsResource::collection($data), 'Programs fetched.']);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        // Check if the authenticated user is a company
        if ($user->role->name !== Role::COMPANY) {
            return response()->json(['error' => 'Company users are not allowed to create the records'], 403);
        }
        
        $validator = Validator::make($request->all(),[
            'user_id'=> 'required',
            'category' => 'required',
            'price' => 'required',
            'payment_deadline' => 'required',
        ]);

        if($validator->fails()){
            return response()->json("validation false hz", $validator->errors());       
        }
        
        $user = auth()->user();

        $userInfo = User_Info::where('user_id', $request->user_id)->first();
        $userBaseInfo = User::where('user_id', $request->user_id)->first();

        if ($userBaseInfo->fullname === null) {
            return response()->json(['error' => 'User not found'], 405);
        }

        if ($userInfo->house_number === null || $userInfo->street_number === null || $userInfo->phonenumber === null) {
            return response()->json(['error' => 'User is missing information, cannot create!'], 403);
        }

        $waterbills = waterbills::create([
            'user_id' => $userInfo->user_id, // Associate the user ID
            'fullname' => $userBaseInfo->fullname,
            'phonenumber' => $userInfo->phonenumber, // Retrieve the value from the user info
            'house_number' => $userInfo->house_number, // Retrieve the value from the user info
            'street_number' => $userInfo->street_number, // Retrieve the value from the user info
            'payment_deadline' => $request->payment_deadline,
            'category' => $request->category,
            'price' => $request->price,
            'payment_status' => $request->payment_status,
        ]);
        
        return response($waterbills, 200);
        // return response()->json(['Bill created successfully.', new WaterbillsResource($waterbills)]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $waterbills = waterbills::find($id);
        if (is_null($waterbills)) {
            return response()->json('Water bill not found', 404); 
        }

        // Check if the authenticated user is the owner of the form
        $user = auth()->user();
        if ($user->user_id !== $waterbills->user_id && $user->role->name !== Role::COMPANY) {
            return response()->json('You are not authorized to view this user info', 403);
        }

        return response()->json($waterbills, 200);
        // return response()->json([new WaterbillsResource($waterbill)]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Validating the request data
        $validator = Validator::make($request->all(), [
            'category' => 'required',
            'date_payment' => 'required',
            'price' => 'required',
            'payment_status' => 'required',
        ]);

        // Handling validation errors
        if ($validator->fails()) {
            return response()->json($validator->errors());       
        }

        $user = auth()->user();
        // Retrieve the existing Security bill record
        $waterbills = waterbills::find($id);

        if (!$waterbills) {
            return response()->json('Bill not found', 404);
        }

        // Check if the authenticated user is the owner of the user info
        if ($user->user_id !== $waterbills->user_id && $user->role->name !== Role::COMPANY) {
            return response()->json('You are not authorized to update this bill', 403);
        }

        // Updating the electric bill form with the request data
        $waterbills->category = $request->category;
        $waterbills->date_payment = $request->date_payment;
        $waterbills->price = $request->price;
        $waterbills->payment_status = $request->payment_status;

        // Saving the updated electric bill form
        $waterbills->save();

        return response()->json($waterbills, 200);
        // return response()->json(['Bill updated successfully.', new WaterbillsResource($waterbills)]);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {

        $user = auth()->user();

        $waterbills = waterbills::find($id);

        if ($user->user_id !== $waterbills->user_id && $user->role->name !== Role::COMPANY) {
        // User is not authorized to delete this form
        return response()->json('You are not authorized to delete this bill', 403);
        }
        $waterbills->delete();

        return response()->json('Bill deleted successfully');
    }

    /**
     * Search user info records.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function search(Request $request)
    {
        // Retrieve the keyword from the request
        $keyword = $request->input('keyword');

        $user = auth()->user();

        $query = waterbills::query();

        if (!$user->role) {
            return response()->json('You are not authorized to perform this action', 403);
        }

        // Check if the authenticated user is a company
        if ($user->role->name === Role::COMPANY) {
            // Add your search criteria for company role here
            $query->where(function ($innerQuery) use ($keyword) {
                $innerQuery->where('username', 'like', "%$keyword%")
                    ->orWhere('fullname', 'like', "%$keyword%")
                    ->orWhere('phonenumber', 'like', "%$keyword%")
                    ->orWhere('house_type', 'like', "%$keyword%")
                    ->orWhere('house_number', 'like', "%$keyword%")
                    ->orWhere('street_number', 'like', "%$keyword%")
                    ->orWhere('category', 'like', "%$keyword%")
                    ->orWhere('date_payment', 'like', "%$keyword%")
                    ->orWhere('price', 'like', "%$keyword%")
                    ->orWhere('payment_status', 'like', "%$keyword%");
            });
        } else {
            // Add your search criteria for other roles here
            $query->where('user_id', $user->id)->where(function ($innerQuery) use ($keyword) {
                $innerQuery->where('username', 'like', "%$keyword%")
                    ->orWhere('fullname', 'like', "%$keyword%")
                    ->orWhere('phonenumber', 'like', "%$keyword%")
                    ->orWhere('house_type', 'like', "%$keyword%")
                    ->orWhere('house_number', 'like', "%$keyword%")
                    ->orWhere('street_number', 'like', "%$keyword%")
                    ->orWhere('category', 'like', "%$keyword%")
                    ->orWhere('date_payment', 'like', "%$keyword%")
                    ->orWhere('price', 'like', "%$keyword%")
                    ->orWhere('payment_status', 'like', "%$keyword%");
            });
        }

        $results = $query->get();

        if ($results->isEmpty()) {
            return response()->json('No data found.', 404);
        }

        return response()->json($results);
    }
}
